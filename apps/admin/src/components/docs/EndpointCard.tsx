"use client";

/**
 * EndpointCard Component
 *
 * Reusable card for displaying API endpoint documentation.
 */

import { cn } from "@/lib/utils";
import { Badge, Card, Text, Title } from "@tremor/react";
import { useState } from "react";

// =============================================================================
// Types
// =============================================================================

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface EndpointResponse {
  field: string;
  type: string;
  description: string;
}

export interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: boolean;
  params?: EndpointParam[];
  body?: EndpointParam[];
  response?: EndpointResponse[];
  example?: {
    request?: string;
    response?: string;
  };
}

interface EndpointCardProps {
  endpoint: Endpoint;
  defaultOpen?: boolean;
}

// =============================================================================
// Method Badge
// =============================================================================

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400 border-green-500/50",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/50",
  PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-mono font-bold rounded border",
        methodColors[method] || "bg-gray-500/20 text-gray-400 border-gray-500/50"
      )}
    >
      {method}
    </span>
  );
}

// =============================================================================
// Endpoint Card
// =============================================================================

export function EndpointCard({ endpoint, defaultOpen = false }: EndpointCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-mono">{endpoint.path}</code>
          {endpoint.auth && (
            <Badge size="sm" color="yellow">
              Auth Required
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Text className="text-muted-foreground text-sm hidden md:block">
            {endpoint.description}
          </Text>
          <span className="text-muted-foreground">{isOpen ? "▼" : "▶"}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t p-4 space-y-4">
          {/* Description */}
          <Text className="text-muted-foreground md:hidden">{endpoint.description}</Text>

          {/* Query Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <Text className="font-semibold mb-2">Query Parameters</Text>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Required</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((param) => (
                      <tr key={param.name} className="border-t">
                        <td className="p-2">
                          <code className="text-xs">{param.name}</code>
                        </td>
                        <td className="p-2">
                          <code className="text-xs text-muted-foreground">{param.type}</code>
                        </td>
                        <td className="p-2">
                          {param.required ? (
                            <Badge size="sm" color="red">
                              Yes
                            </Badge>
                          ) : (
                            <Badge size="sm" color="gray">
                              No
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <Text className="font-semibold mb-2">Request Body</Text>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Field</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Required</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.body.map((field) => (
                      <tr key={field.name} className="border-t">
                        <td className="p-2">
                          <code className="text-xs">{field.name}</code>
                        </td>
                        <td className="p-2">
                          <code className="text-xs text-muted-foreground">{field.type}</code>
                        </td>
                        <td className="p-2">
                          {field.required ? (
                            <Badge size="sm" color="red">
                              Yes
                            </Badge>
                          ) : (
                            <Badge size="sm" color="gray">
                              No
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Response */}
          {endpoint.response && endpoint.response.length > 0 && (
            <div>
              <Text className="font-semibold mb-2">Response</Text>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Field</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.response.map((field) => (
                      <tr key={field.field} className="border-t">
                        <td className="p-2">
                          <code className="text-xs">{field.field}</code>
                        </td>
                        <td className="p-2">
                          <code className="text-xs text-muted-foreground">{field.type}</code>
                        </td>
                        <td className="p-2 text-muted-foreground">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example */}
          {endpoint.example && (
            <div className="grid gap-4 md:grid-cols-2">
              {endpoint.example.request && (
                <div>
                  <Text className="font-semibold mb-2">Example Request</Text>
                  <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{endpoint.example.request}</code>
                  </pre>
                </div>
              )}
              {endpoint.example.response && (
                <div>
                  <Text className="font-semibold mb-2">Example Response</Text>
                  <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{endpoint.example.response}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// Endpoint Category
// =============================================================================

interface EndpointCategoryProps {
  title: string;
  description: string;
  endpoints: Endpoint[];
}

export function EndpointCategory({ title, description, endpoints }: EndpointCategoryProps) {
  return (
    <div className="space-y-4">
      <div>
        <Title>{title}</Title>
        <Text className="text-muted-foreground">{description}</Text>
      </div>
      <div className="space-y-2">
        {endpoints.map((endpoint, index) => (
          <EndpointCard key={`${endpoint.method}-${endpoint.path}-${index}`} endpoint={endpoint} />
        ))}
      </div>
    </div>
  );
}
