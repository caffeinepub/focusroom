import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Int "mo:core/Int";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Event = {
    name : Text;
    date : Time.Time;
    phase : ?Phase;
  };

  type RoomId = Text;
  type UniqueCode = Text;

  type Session = {
    startTime : Time.Time;
    phase : Phase;
    isPause : Bool;
  };

  type Room = {
    id : RoomId;
    creator : Principal;
  };

  type Participant = {
    principal : Principal;
    username : Text;
  };

  type Phase = {
    #focus;
    #pause;
  };

  type RoomState = {
    var participants : Set.Set<Principal>;
    var session : ?Session;
    creator : Principal;
  };

  public type UserProfile = {
    username : Text;
  };

  public type Signal = {
    from : Principal;
    to : Principal;
    signalType : SignalType;
    payload : Text;
  };

  public type SignalType = {
    #offer;
    #answer;
    #iceCandidate;
  };

  public type SignalResponse = {
    data : [Signal];
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let rooms = Map.empty<RoomId, RoomState>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let events = Map.empty<UniqueCode, Event>();
  let roomsReverseIndex = Map.empty<UniqueCode, RoomId>();

  // Map<RoomId, Map<Recipient, List<Signal>>>
  let roomToRecipientToPendingSignals = Map.empty<RoomId, Map.Map<Principal, List.List<Signal>>>();

  let joinedRoomsList = List.empty<RoomId>();
  let burntRoomsList = List.empty<RoomId>();

  // --- User Profile Functions (required by instructions) ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --- Room Functions ---
  public shared ({ caller }) func createRoom() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };

    let code = generateUniqueCode();

    let roomState : RoomState = {
      var participants = Set.empty<Principal>();
      var session = null;
      creator = caller;
    };

    let recipientMap = Map.empty<Principal, List.List<Signal>>();
    rooms.add(code, roomState);
    roomsReverseIndex.add(code, code);

    roomToRecipientToPendingSignals.add(code, recipientMap);

    code;
  };

  public shared ({ caller }) func joinRoom(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };

    let roomState = switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?state) { state };
    };

    roomState.participants.add(caller);
  };

  // Any participant can start a session. Timer becomes independent of host.
  public shared ({ caller }) func startSession(code : Text, phase : Phase) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sessions");
    };

    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?roomState) {
        roomState.session := ?{
          startTime = Time.now();
          phase;
          isPause = false;
        };
      };
    };
  };

  public query ({ caller }) func getTimerState(code : Text) : async ?Session {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get timer state");
    };
    switch (rooms.get(code)) {
      case (null) { null };
      case (?state) { state.session };
    };
  };

  public query ({ caller }) func getCurrentCategory() : async ?RoomId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access room navigation");
    };
    ?joinedRoomsList.at(0);
  };

  public query ({ caller }) func getPreviousCategories() : async [RoomId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access room navigation");
    };
    if (joinedRoomsList.size() == 0) {
      [];
    } else {
      let iter = joinedRoomsList.values();
      let tempList = List.empty<RoomId>();
      var isFirst = true;
      for (roomId in iter) {
        if (isFirst) {
          isFirst := false;
        } else {
          tempList.add(roomId);
        };
      };
      tempList.toArray();
    };
  };

  public query ({ caller }) func getBurntCategories() : async [RoomId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access room navigation");
    };
    burntRoomsList.toArray();
  };

  // --- Event Functions ---
  public shared ({ caller }) func storeEvent(name : Text, phase : ?Phase, date : Time.Time) : async UniqueCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store events");
    };

    let event : Event = {
      name;
      date;
      phase;
    };

    let uniqueCode = generateUniqueCode();
    events.add(uniqueCode, event);
    uniqueCode;
  };

  // --- WebRTC Signaling Functions ---

  // Caller must be a registered user. The `from` field is forced to `caller`
  // to prevent identity spoofing.
  public shared ({ caller }) func sendSignal(roomId : Text, recipient : Principal, signalType : SignalType, payload : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send signals");
    };

    let recipientMap = switch (roomToRecipientToPendingSignals.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?map) { map };
    };

    // Verify caller is a participant in the room
    let roomState = switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?state) { state };
    };
    if (not roomState.participants.contains(caller)) {
      Runtime.trap("Unauthorized: Caller is not a participant in this room");
    };

    let signal : Signal = {
      from = caller; // enforce sender identity
      to = recipient;
      signalType;
      payload;
    };

    let signalList = switch (recipientMap.get(recipient)) {
      case (null) { List.empty<Signal>() };
      case (?existingList) { existingList };
    };

    signalList.add(signal);
    recipientMap.add(recipient, signalList);
  };

  public query ({ caller }) func receiveSignals(roomId : Text) : async SignalResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can receive signals");
    };

    switch (roomToRecipientToPendingSignals.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?recipientMap) {
        let signalsList = switch (recipientMap.get(caller)) {
          case (null) { List.empty<Signal>() };
          case (?existingList) { existingList };
        };
        {
          data = signalsList.toArray();
        };
      };
    };
  };

  public shared ({ caller }) func clearSignals(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear signals");
    };

    switch (roomToRecipientToPendingSignals.get(roomId)) {
      case (null) {
        Runtime.trap("Room not found");
      };
      case (?recipientMap) {
        // Only clear the caller's own signal queue
        recipientMap.add(caller, List.empty<Signal>());
      };
    };
  };

  public query ({ caller }) func getRoomParticipants(roomId : Text) : async [(Principal, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view room participants");
    };

    let roomState = switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?state) { state };
    };

    // Only participants in the room or admins may view the participant list
    if (not roomState.participants.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only room participants can view the participant list");
    };

    roomState.participants.toArray().map(
      func(principal) {
        let username = switch (userProfiles.get(principal)) {
          case (null) { "" };
          case (?profile) { profile.username };
        };
        (principal, username);
      }
    );
  };

  // --- Helper Functions ---
  func generateUniqueCode() : UniqueCode {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let charArray = chars.toArray();
    let size = charArray.size();
    let t = Time.now();
    var seed = Int.abs(t);
    var code = "";
    var i = 0;
    while (i < 6) {
      let idx = seed % size;
      seed := seed / size + (seed * 6364136223846793005 + 1442695040888963407);
      code := code # Text.fromChar(charArray[idx]);
      i += 1;
    };
    code;
  };
};
