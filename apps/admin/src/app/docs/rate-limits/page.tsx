"use client";

/**
 * Rate Limits Documentation Page
 *
 * Detailed explanation of rate limiting tiers and headers.
 */

import { CodeBlock, InfoBox } from "@/components/docs";
import { PageWrapper } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Card, Text, Title } from "@tremor/react";
import Link from "next/link";

// =============================================================================
// Component
// =============================================================================

export default function RateLimitsPage() {
  // Sample rate limit visualization data
  const rateLimitData = [
    { tier: "Standard", perMinute: 100, daily: 10000 },
    { tier: "Premium", perMinute: 300, daily: 50000 },
    { tier: "Enterprise", perMinute: 1000, daily: 500000 },
  ];

  return (
    <PageWrapper
      title="Rate Limits"
      description="Understanding API rate limiting and best practices"
      actions={
        <Button variant="outline" asChild>
          <Link href="/docs">← Back to Docs</Link>
        </Button>
      }
    >
      {/* Overview */}
      <Card className="mb-6">
        <Title>Overview</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          The API uses a two-tier rate limiting system to ensure fair usage and platform stability.
          All rate limits are applied per API key.
        </Text>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="p-6 rounded-lg border bg-blue-500/10 border-blue-500/50">
            <Text className="text-sm text-muted-foreground">Per-Minute Limit</Text>
            <Text className="text-4xl font-bold text-blue-400">100</Text>
            <Text className="text-sm text-muted-foreground">requests / minute</Text>
          </div>
          <div className="p-6 rounded-lg border bg-purple-500/10 border-purple-500/50">
            <Text className="text-sm text-muted-foreground">Daily Limit</Text>
            <Text className="text-4xl font-bold text-purple-400">10,000</Text>
            <Text className="text-sm text-muted-foreground">requests / day</Text>
          </div>
        </div>

        <InfoBox type="info" title="Rate Limit Tiers">
          Premium and Enterprise tiers are available for high-volume integrations. Contact support
          for more information about upgrading your rate limits.
        </InfoBox>
      </Card>

      {/* Rate Limit Tiers */}
      <Card className="mb-6">
        <Title>Rate Limit Tiers</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          Different tiers are available based on your needs.
        </Text>

        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-left p-3 font-medium">Per-Minute</th>
                <th className="text-left p-3 font-medium">Daily</th>
                <th className="text-left p-3 font-medium">Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">
                  <Badge variant="outline">Standard</Badge>
                </td>
                <td className="p-3">100</td>
                <td className="p-3">10,000</td>
                <td className="p-3 text-muted-foreground">Single agent, casual development</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <Badge variant="default">Premium</Badge>
                </td>
                <td className="p-3">300</td>
                <td className="p-3">50,000</td>
                <td className="p-3 text-muted-foreground">Multiple agents, active play</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    Enterprise
                  </Badge>
                </td>
                <td className="p-3">1,000</td>
                <td className="p-3">500,000</td>
                <td className="p-3 text-muted-foreground">Large scale integrations</td>
              </tr>
            </tbody>
          </table>
        </div>

        <BarChart
          className="h-48"
          data={rateLimitData}
          index="tier"
          categories={["perMinute", "daily"]}
          colors={["blue", "purple"]}
          showAnimation
        />
      </Card>

      {/* Rate Limit Headers */}
      <Card className="mb-6">
        <Title>Rate Limit Headers</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          Every API response includes headers to help you track your rate limit status.
        </Text>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Header</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Limit</code>
                </td>
                <td className="p-3 text-muted-foreground">Maximum requests per minute</td>
                <td className="p-3">
                  <code className="text-xs">100</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Remaining</code>
                </td>
                <td className="p-3 text-muted-foreground">Requests remaining this minute</td>
                <td className="p-3">
                  <code className="text-xs">87</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Reset</code>
                </td>
                <td className="p-3 text-muted-foreground">
                  Unix timestamp when minute window resets
                </td>
                <td className="p-3">
                  <code className="text-xs">1705350060</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Daily-Limit</code>
                </td>
                <td className="p-3 text-muted-foreground">Maximum requests per day</td>
                <td className="p-3">
                  <code className="text-xs">10000</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Daily-Remaining</code>
                </td>
                <td className="p-3 text-muted-foreground">Requests remaining today</td>
                <td className="p-3">
                  <code className="text-xs">9542</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">X-RateLimit-Daily-Reset</code>
                </td>
                <td className="p-3 text-muted-foreground">
                  Unix timestamp when daily window resets
                </td>
                <td className="p-3">
                  <code className="text-xs">1705392000</code>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-3">
                  <code className="text-xs">Retry-After</code>
                </td>
                <td className="p-3 text-muted-foreground">
                  Seconds to wait (only when rate limited)
                </td>
                <td className="p-3">
                  <code className="text-xs">32</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Handling Rate Limits */}
      <Card className="mb-6">
        <Title>Handling Rate Limits</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          When you exceed rate limits, the API returns a 429 status code with details.
        </Text>

        <div className="space-y-4">
          <div>
            <Text className="font-semibold mb-2">Rate Limited Response (429)</Text>
            <CodeBlock
              language="json"
              code={`{
  "error": "Rate limit exceeded",
  "retryAfter": 32,
  "dailyResetAt": 1705392000000,
  "_meta": {
    "requestId": "req_abc123_xyz789",
    "timestamp": 1705350000000,
    "rateLimit": {
      "remaining": 0,
      "limit": 100,
      "resetAt": 1705350060000,
      "dailyRemaining": 0,
      "dailyLimit": 10000,
      "dailyResetAt": 1705392000000
    }
  }
}`}
            />
          </div>

          <InfoBox type="warning" title="Respect Retry-After">
            When you receive a 429 response, wait at least the number of seconds specified in the{" "}
            <code>Retry-After</code> header before retrying. Continuing to make requests will reset
            the timeout.
          </InfoBox>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="mb-6">
        <Title>Best Practices</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          Follow these guidelines to avoid hitting rate limits and ensure smooth operation.
        </Text>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border">
            <Text className="font-semibold mb-2">1. Implement Exponential Backoff</Text>
            <Text className="text-sm text-muted-foreground mb-3">
              When rate limited, wait progressively longer between retries.
            </Text>
            <CodeBlock
              language="typescript"
              code={`async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      const backoff = retryAfter * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoff * 1000));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}`}
            />
          </div>

          <div className="p-4 rounded-lg border">
            <Text className="font-semibold mb-2">2. Track Rate Limit Headers</Text>
            <Text className="text-sm text-muted-foreground mb-3">
              Monitor your usage proactively to avoid hitting limits.
            </Text>
            <CodeBlock
              language="typescript"
              code={`function handleResponse(response: Response) {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const dailyRemaining = parseInt(response.headers.get('X-RateLimit-Daily-Remaining') || '0');

  if (remaining < 10) {
    console.warn('Approaching per-minute rate limit');
  }

  if (dailyRemaining < 100) {
    console.warn('Approaching daily rate limit');
  }
}`}
            />
          </div>

          <div className="p-4 rounded-lg border">
            <Text className="font-semibold mb-2">3. Use Webhooks for Real-time Updates</Text>
            <Text className="text-sm text-muted-foreground">
              Instead of polling for game state changes, register webhooks to receive push
              notifications. This dramatically reduces API calls.
            </Text>
          </div>

          <div className="p-4 rounded-lg border">
            <Text className="font-semibold mb-2">4. Batch Operations When Possible</Text>
            <Text className="text-sm text-muted-foreground">
              Some endpoints support batch operations. Use them to reduce the number of individual
              API calls needed.
            </Text>
          </div>

          <div className="p-4 rounded-lg border">
            <Text className="font-semibold mb-2">5. Cache Responses</Text>
            <Text className="text-sm text-muted-foreground">
              Cache data that doesn&apos;t change frequently (like game rules, card templates) to
              reduce unnecessary API calls.
            </Text>
          </div>
        </div>
      </Card>

      {/* Check Rate Limit Endpoint */}
      <Card>
        <Title>Checking Rate Limit Status</Title>
        <Text className="text-muted-foreground mt-2 mb-4">
          Use the dedicated endpoint to check your current rate limit status without consuming a
          request.
        </Text>

        <CodeBlock
          language="bash"
          title="Check Rate Limit"
          code={`curl -X GET https://api.lunchtable.gg/api/agents/rate-limit \\
  -H "Authorization: Bearer ltk_your_api_key"`}
        />

        <div className="mt-4">
          <Text className="font-semibold mb-2">Response</Text>
          <CodeBlock
            language="json"
            code={`{
  "remaining": 95,
  "limit": 100,
  "resetAt": 1705350060000,
  "dailyRemaining": 9850,
  "dailyLimit": 10000,
  "dailyResetAt": 1705392000000
}`}
          />
        </div>
      </Card>
    </PageWrapper>
  );
}
