"use client";

/* eslint-disable react/no-unescaped-entities */

/**
 * Batch Operations Page
 *
 * Perform bulk actions on multiple players at once.
 */

import { Card, Text, Title } from "@tremor/react";
import {
  BatchGrantCardsForm,
  GrantCardsForm,
  GrantGoldForm,
  GrantPacksForm,
  GrantPremiumForm,
  RemoveCardsForm,
  ResetRatingsForm,
} from "@/components/batch";
import { PageWrapper } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/contexts/AdminContext";

// =============================================================================
// Component
// =============================================================================

export default function BatchOperationsPage() {
  return (
    <PageWrapper
      title="Batch Operations"
      description="Perform bulk actions on multiple players simultaneously"
    >
      {/* Info Card */}
      <Card className="mb-6">
        <Title>About Batch Operations</Title>
        <Text className="text-muted-foreground">
          Use batch operations to perform actions on multiple players at once. All actions are
          logged to the audit trail for accountability.
        </Text>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <Text className="font-medium">💰 Currency</Text>
            <Text className="text-xs text-muted-foreground">Gold and premium currency</Text>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Text className="font-medium">📦 Packs</Text>
            <Text className="text-xs text-muted-foreground">Grant card packs</Text>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Text className="font-medium">🃏 Cards</Text>
            <Text className="text-xs text-muted-foreground">Grant or remove cards</Text>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Text className="font-medium">📊 Ratings</Text>
            <Text className="text-xs text-muted-foreground">Reset ELO ratings</Text>
          </div>
        </div>
      </Card>

      {/* Operations Tabs */}
      <RoleGuard
        permission="batch.operations"
        fallback={
          <Card>
            <div className="text-center py-8">
              <Text className="text-muted-foreground">
                You don't have permission to perform batch operations.
              </Text>
            </div>
          </Card>
        }
      >
        <Tabs defaultValue="gold" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="gold">Grant Gold</TabsTrigger>
            <TabsTrigger value="premium">Grant Premium</TabsTrigger>
            <TabsTrigger value="packs">Grant Packs</TabsTrigger>
            <TabsTrigger value="cards-single">Grant Cards (Single)</TabsTrigger>
            <TabsTrigger value="cards-batch">Grant Cards (Batch)</TabsTrigger>
            <TabsTrigger value="remove-cards">Remove Cards</TabsTrigger>
            <TabsTrigger value="ratings">Reset Ratings</TabsTrigger>
          </TabsList>

          {/* Grant Gold Tab */}
          <TabsContent value="gold">
            <Card>
              <Title>Grant Gold</Title>
              <Text className="text-muted-foreground mb-6">
                Give gold currency to selected players. This is the standard in-game currency.
              </Text>
              <GrantGoldForm />
            </Card>
          </TabsContent>

          {/* Grant Premium Tab */}
          <TabsContent value="premium">
            <Card>
              <Title>Grant Premium Currency</Title>
              <Text className="text-muted-foreground mb-6">
                Give premium currency to selected players. Use for special rewards or compensation.
              </Text>
              <GrantPremiumForm />
            </Card>
          </TabsContent>

          {/* Grant Packs Tab */}
          <TabsContent value="packs">
            <Card>
              <Title>Grant Card Packs</Title>
              <Text className="text-muted-foreground mb-6">
                Give card packs to selected players. They will appear in the player's inventory.
              </Text>
              <GrantPacksForm />
            </Card>
          </TabsContent>

          {/* Grant Cards Single Tab */}
          <TabsContent value="cards-single">
            <Card>
              <Title>Grant Cards to Single Player</Title>
              <Text className="text-muted-foreground mb-6">
                Give specific cards to a single player. Use for targeted rewards or customer
                support.
              </Text>
              <GrantCardsForm />
            </Card>
          </TabsContent>

          {/* Grant Cards Batch Tab */}
          <TabsContent value="cards-batch">
            <Card>
              <Title>Batch Grant Cards</Title>
              <Text className="text-muted-foreground mb-6">
                Give the same cards to multiple players at once. Great for season rewards.
              </Text>
              <BatchGrantCardsForm />
            </Card>
          </TabsContent>

          {/* Remove Cards Tab */}
          <TabsContent value="remove-cards">
            <Card>
              <Title>Remove Cards from Player</Title>
              <Text className="text-muted-foreground mb-6">
                Remove specific cards from a player's inventory. Use with caution.
              </Text>
              <RemoveCardsForm />
            </Card>
          </TabsContent>

          {/* Reset Ratings Tab */}
          <TabsContent value="ratings">
            <Card>
              <Title>Reset Player Ratings</Title>
              <Text className="text-muted-foreground mb-6">
                Reset ELO ratings to 1200 for selected players. Use with caution - this cannot be
                undone.
              </Text>
              <ResetRatingsForm />
            </Card>
          </TabsContent>
        </Tabs>
      </RoleGuard>

      {/* Warning Card */}
      <Card className="mt-6 border-yellow-500/50">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <Title>Important Notes</Title>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>• All batch operations are logged with your admin ID</li>
              <li>• Large operations may take a few moments to complete</li>
              <li>• Currency grants are immediately available to players</li>
              <li>• Rating resets cannot be undone - use carefully</li>
            </ul>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
