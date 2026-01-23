"use client";

/**
 * Forum Category Management Page
 *
 * Create, edit, and manage forum categories.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, Text, Title } from "@tremor/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/contexts/AdminContext";

// =============================================================================
// Types
// =============================================================================

interface Category {
  _id: Id<"forumCategories">;
  categoryId: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isLocked: boolean;
  allowAiAgents: boolean;
  threadCount: number;
  postCount: number;
  lastPostAt?: number;
  lastThreadTitle?: string;
  lastPostAuthor?: string;
}

interface CategoryFormData {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  isVisible: boolean;
  isLocked: boolean;
  minLevelToPost: number;
  minLevelToReply: number;
  allowAiAgents: boolean;
}

const defaultFormData: CategoryFormData = {
  categoryId: "",
  name: "",
  description: "",
  icon: "💬",
  color: "#3b82f6",
  sortOrder: 0,
  isVisible: true,
  isLocked: false,
  minLevelToPost: 1,
  minLevelToReply: 1,
  allowAiAgents: true,
};

// =============================================================================
// Component
// =============================================================================

export default function ForumCategoriesPage() {
  const { playerId } = useAdmin();

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [deleteReason, setDeleteReason] = useState("");

  // Queries
  const categories = useQuery(api.social.forums.getCategories);

  // Mutations
  const createCategory = useMutation(api.admin.forumModeration.createCategory);
  const updateCategory = useMutation(api.admin.forumModeration.updateCategory);
  const deleteCategory = useMutation(api.admin.forumModeration.deleteCategory);

  const isLoading = categories === undefined;

  // Handlers
  const handleCreate = async () => {
    if (!playerId) return;
    try {
      await createCategory({
        moderatorId: playerId,
        categoryId: formData.categoryId,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        sortOrder: formData.sortOrder,
        isVisible: formData.isVisible,
        isLocked: formData.isLocked,
        minLevelToPost: formData.minLevelToPost,
        minLevelToReply: formData.minLevelToReply,
        allowAiAgents: formData.allowAiAgents,
      });
      setCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleUpdate = async () => {
    if (!playerId || !selectedCategory) return;
    try {
      await updateCategory({
        moderatorId: playerId,
        categoryDocId: selectedCategory._id,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        sortOrder: formData.sortOrder,
        isVisible: formData.isVisible,
        isLocked: formData.isLocked,
        minLevelToPost: formData.minLevelToPost,
        minLevelToReply: formData.minLevelToReply,
        allowAiAgents: formData.allowAiAgents,
      });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDelete = async () => {
    if (!playerId || !selectedCategory) return;
    try {
      await deleteCategory({
        moderatorId: playerId,
        categoryDocId: selectedCategory._id,
        reason: deleteReason,
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      setDeleteReason("");
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      icon: category.icon || "💬",
      color: category.color || "#3b82f6",
      sortOrder: category.sortOrder,
      isVisible: true, // Only visible categories are returned by the query
      isLocked: category.isLocked,
      minLevelToPost: 1, // Not returned by getCategories
      minLevelToReply: 1, // Not returned by getCategories
      allowAiAgents: category.allowAiAgents,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const updateFormField = <K extends keyof CategoryFormData>(
    field: K,
    value: CategoryFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <PageWrapper
      title="Forum Categories"
      description="Manage forum categories and their settings"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/forum">
              <span className="mr-2">←</span>
              Back to Forum
            </Link>
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <span className="mr-2">+</span>
            Create Category
          </Button>
        </div>
      }
    >
      {/* Categories List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          </Card>
        ) : categories?.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <span className="text-3xl">📁</span>
              <Text className="mt-2">No categories yet. Create one to get started!</Text>
            </div>
          </Card>
        ) : (
          categories?.map((category: Category) => (
            <Card key={category._id} className="hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{category.icon || "💬"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Title className="text-lg">{category.name}</Title>
                      {category.isLocked && <Badge variant="secondary">Locked</Badge>}
                    </div>
                    <Text className="text-muted-foreground mt-1">{category.description}</Text>
                    <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{category.threadCount} threads</span>
                      <span>{category.postCount} posts</span>
                      <span>Sort: {category.sortOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDeleteDialog(category)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new forum category.</DialogDescription>
          </DialogHeader>

          <CategoryForm formData={formData} updateFormField={updateFormField} isCreate />

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.categoryId.trim() || !formData.name.trim()}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category settings.</DialogDescription>
          </DialogHeader>

          <CategoryForm formData={formData} updateFormField={updateFormField} isCreate={false} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              This will hide and lock the category. Categories with threads cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <Text className="font-medium">{selectedCategory.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {selectedCategory.threadCount} threads, {selectedCategory.postCount} posts
                </Text>
              </div>

              <div className="space-y-2">
                <Label>Reason for deletion:</Label>
                <Textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!deleteReason.trim()}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

// =============================================================================
// Category Form Component
// =============================================================================

interface CategoryFormProps {
  formData: CategoryFormData;
  updateFormField: <K extends keyof CategoryFormData>(field: K, value: CategoryFormData[K]) => void;
  isCreate: boolean;
}

function CategoryForm({ formData, updateFormField, isCreate }: CategoryFormProps) {
  return (
    <div className="space-y-4">
      {isCreate && (
        <div className="space-y-2">
          <Label>Category ID (slug)</Label>
          <Input
            value={formData.categoryId}
            onChange={(e) => updateFormField("categoryId", e.target.value)}
            placeholder="general-discussion"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateFormField("name", e.target.value)}
            placeholder="General Discussion"
          />
        </div>
        <div className="space-y-2">
          <Label>Icon (emoji)</Label>
          <Input
            value={formData.icon}
            onChange={(e) => updateFormField("icon", e.target.value)}
            placeholder="💬"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateFormField("description", e.target.value)}
          placeholder="A place for general conversations..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => updateFormField("sortOrder", parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Min Level to Post</Label>
          <Input
            type="number"
            value={formData.minLevelToPost}
            onChange={(e) => updateFormField("minLevelToPost", parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Min Level to Reply</Label>
          <Input
            type="number"
            value={formData.minLevelToReply}
            onChange={(e) => updateFormField("minLevelToReply", parseInt(e.target.value, 10) || 1)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <Label>Visible to users</Label>
          <Switch
            checked={formData.isVisible}
            onCheckedChange={(checked) => updateFormField("isVisible", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Locked (no new posts)</Label>
          <Switch
            checked={formData.isLocked}
            onCheckedChange={(checked) => updateFormField("isLocked", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Allow AI Agents</Label>
          <Switch
            checked={formData.allowAiAgents}
            onCheckedChange={(checked) => updateFormField("allowAiAgents", checked)}
          />
        </div>
      </div>
    </div>
  );
}
