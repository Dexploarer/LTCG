"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Ban,
  Check,
  Circle,
  Clock,
  Loader2,
  MessageSquare,
  MoreVertical,
  Search,
  Swords,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/ConvexAuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FriendStatus = "online" | "offline" | "in-game";
type TabType = "friends" | "requests" | "search";

interface Friend {
  id: string;
  username: string;
  status: FriendStatus;
  lastSeen?: number;
  currentGame?: string;
}

interface FriendRequest {
  id: string;
  from: {
    id: string;
    username: string;
  };
  timestamp: number;
}

// Mock data
const MOCK_FRIENDS: Friend[] = [
  { id: "f1", username: "DragonMaster", status: "online" },
  { id: "f2", username: "ShadowKnight", status: "in-game", currentGame: "Ranked Match" },
  {
    id: "f3",
    username: "PhoenixRider",
    status: "offline",
    lastSeen: Date.now() - 2 * 60 * 60 * 1000,
  },
  { id: "f4", username: "IceQueen", status: "online" },
  {
    id: "f5",
    username: "ThunderGod",
    status: "offline",
    lastSeen: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

const MOCK_REQUESTS: FriendRequest[] = [
  {
    id: "r1",
    from: { id: "u1", username: "NewPlayer123" },
    timestamp: Date.now() - 30 * 60 * 1000,
  },
  {
    id: "r2",
    from: { id: "u2", username: "CardMaster" },
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
];

const statusColors: Record<FriendStatus, string> = {
  online: "bg-green-500",
  offline: "bg-gray-500",
  "in-game": "bg-yellow-500",
};

const statusLabels: Record<FriendStatus, string> = {
  online: "Online",
  offline: "Offline",
  "in-game": "In Game",
};

function formatLastSeen(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Recently";
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function SocialPage() {
  const { token } = useAuth();
  const currentUser = useQuery(api.users.currentUser, token ? { token } : "skip");

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Mock search
    await new Promise((r) => setTimeout(r, 500));
    setSearchResults([
      { id: "s1", username: searchQuery },
      { id: "s2", username: `${searchQuery}Player` },
    ]);
    setIsSearching(false);
  };

  const onlineFriends = MOCK_FRIENDS.filter((f) => f.status !== "offline");
  const offlineFriends = MOCK_FRIENDS.filter((f) => f.status === "offline");

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0a09] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a09] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/10 via-[#0d0a09] to-[#0d0a09]" />

      <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#d4af37]" />
            <h1 className="text-3xl font-bold text-[#e8e0d5]">Social</h1>
          </div>
          <p className="text-[#a89f94]">Connect with friends and find new opponents</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-black/40 rounded-xl border border-[#3d2b1f] w-fit">
          {[
            { id: "friends" as TabType, label: "Friends", icon: Users, count: MOCK_FRIENDS.length },
            {
              id: "requests" as TabType,
              label: "Requests",
              icon: UserPlus,
              count: MOCK_REQUESTS.length,
            },
            { id: "search" as TabType, label: "Find Players", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all",
                  isActive
                    ? "bg-[#d4af37] text-[#1a1614]"
                    : "text-[#a89f94] hover:text-[#e8e0d5] hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      isActive ? "bg-black/20" : "bg-white/10"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="space-y-6">
            {/* Online Friends */}
            {onlineFriends.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#a89f94] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  Online — {onlineFriends.length}
                </h2>
                <div className="space-y-2">
                  {onlineFriends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline Friends */}
            {offlineFriends.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#a89f94] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-gray-500 text-gray-500" />
                  Offline — {offlineFriends.length}
                </h2>
                <div className="space-y-2">
                  {offlineFriends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            )}

            {MOCK_FRIENDS.length === 0 && (
              <div className="text-center py-16 rounded-xl bg-black/40 border border-[#3d2b1f]">
                <Users className="w-16 h-16 mx-auto mb-4 text-[#a89f94]/50" />
                <p className="text-[#e8e0d5] font-bold mb-2">No friends yet</p>
                <p className="text-[#a89f94] mb-4">Find players and send them friend requests!</p>
                <Button
                  onClick={() => setActiveTab("search")}
                  className="bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614]"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Players
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {MOCK_REQUESTS.length === 0 ? (
              <div className="text-center py-16 rounded-xl bg-black/40 border border-[#3d2b1f]">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-[#a89f94]/50" />
                <p className="text-[#a89f94]">No pending friend requests</p>
              </div>
            ) : (
              MOCK_REQUESTS.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-[#3d2b1f]"
                >
                  <Avatar className="w-12 h-12 border border-[#3d2b1f]">
                    <AvatarFallback className="bg-[#1a1614] text-[#d4af37] font-bold">
                      {request.from.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-[#e8e0d5]">{request.from.username}</p>
                    <p className="text-xs text-[#a89f94] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastSeen(request.timestamp)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a89f94]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by username..."
                  className="pl-12 bg-black/40 border-[#3d2b1f] text-[#e8e0d5]"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614]"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-[#3d2b1f]"
                  >
                    <Avatar className="w-12 h-12 border border-[#3d2b1f]">
                      <AvatarFallback className="bg-[#1a1614] text-[#d4af37] font-bold">
                        {player.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-[#e8e0d5]">{player.username}</p>
                    </div>
                    <Button size="sm" className="bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614]">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-16 rounded-xl bg-black/40 border border-[#3d2b1f]">
                <Search className="w-16 h-16 mx-auto mb-4 text-[#a89f94]/50" />
                <p className="text-[#a89f94]">No players found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-[#3d2b1f] hover:bg-white/5 transition-colors">
      <div className="relative">
        <Avatar className="w-12 h-12 border border-[#3d2b1f]">
          <AvatarFallback className="bg-[#1a1614] text-[#d4af37] font-bold">
            {friend.username[0]}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1614]",
            statusColors[friend.status]
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#e8e0d5]">{friend.username}</p>
        <p
          className={cn(
            "text-xs",
            friend.status === "online"
              ? "text-green-400"
              : friend.status === "in-game"
                ? "text-yellow-400"
                : "text-[#a89f94]"
          )}
        >
          {friend.status === "in-game" && friend.currentGame
            ? friend.currentGame
            : friend.status === "offline" && friend.lastSeen
              ? `Last seen ${formatLastSeen(friend.lastSeen)}`
              : statusLabels[friend.status]}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-[#3d2b1f] text-[#a89f94] hover:text-[#e8e0d5]"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        {friend.status !== "offline" && (
          <Button size="sm" className="bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614]">
            <Swords className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        )}
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMenu(!showMenu)}
            className="text-[#a89f94] hover:text-[#e8e0d5]"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 p-1 rounded-lg bg-[#1a1614] border border-[#3d2b1f] shadow-lg z-10">
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a89f94] hover:text-[#e8e0d5] hover:bg-white/5 rounded">
                <UserMinus className="w-4 h-4" />
                Remove Friend
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded">
                <Ban className="w-4 h-4" />
                Block
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
