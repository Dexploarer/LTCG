/**
 * Top-level friends export for backward compatibility
 * Maintains flat API structure (api.friends.*) while code is organized in subdirectories
 */

export {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getBlockedUsers,
  searchUsers,
} from "./social/friends";
