import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Use migration function from migration.mo

actor {
  type Event = {
    name : Text;
    date : Time.Time;
  };

  type RoomId = Text;
  type UniqueCode = Text;

  type Room = {
    id : RoomId;
    creator : Principal;
  };

  type Participant = {
    principal : Principal;
    username : Text;
  };

  type RoomState = {
    participants : Set.Set<Principal>;
    creator : Principal;
  };

  public type UserProfile = {
    username : Text;
    xp : Nat;
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

  // --- User Profile Functions ---
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
    // Preserve existing XP when saving profile metadata
    let existingXp = switch (userProfiles.get(caller)) {
      case (null) { 0 };
      case (?existing) { existing.xp };
    };
    userProfiles.add(caller, { username = profile.username; xp = existingXp });
  };

  // --- Room Functions ---
  public shared ({ caller }) func createRoom() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };

    let code = generateUniqueCode();

    let roomState : RoomState = {
      participants = Set.empty<Principal>();
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

  // --- XP Functions ---
  // Called by the frontend every 30 continuous minutes the user remains in a room.
  // Users may only award XP to themselves; admins may award XP to any user.
  public shared ({ caller }) func awardXp(recipient : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can trigger XP awards");
    };
    // A regular user may only award XP to themselves to prevent spoofing.
    if (caller != recipient and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Users can only award XP to themselves");
    };
    let currentProfile = switch (userProfiles.get(recipient)) {
      case (null) { Runtime.trap("Recipient profile not found") };
      case (?profile) { profile };
    };
    let updatedProfile : UserProfile = {
      username = currentProfile.username;
      xp = currentProfile.xp + amount;
    };
    userProfiles.add(recipient, updatedProfile);
  };

  // --- Event Functions ---
  public shared ({ caller }) func storeEvent(name : Text, date : Time.Time) : async UniqueCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store events");
    };

    let event : Event = {
      name;
      date;
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
