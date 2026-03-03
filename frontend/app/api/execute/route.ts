/**
 * NeuraSight Execute API Route (Pro Debug Edition)
 * Updated to catch case-sensitivity and hidden env issues.
 */

import { NextRequest, NextResponse } from "next/server";

interface ExecutePayload {
  metric: string;
  action: string;
  persona?: string;
  severity?: "critical" | "warning" | "info";
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string; emoji?: boolean }>;
}

function buildSlackPayload(data: ExecutePayload): { blocks: SlackBlock[] } {
  const severityEmoji = { critical: "🚨", warning: "⚠️", info: "ℹ️" };
  const emoji = severityEmoji[data.severity || "info"];
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} NeuraSight AI Alert`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Metric:* ${data.metric}\n*Action Executed:* ${data.action}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Persona:* ${data.persona || "Executive"}\n*Timestamp:* ${timestamp} UTC` },
      },
      { type: "divider" },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "🧠 Powered by NeuraSight Strong Brain" }],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecutePayload = await request.json();

    // 🕵️‍♂️ DEEP DEBUGGING LOGS
    // Hum uppercase aur lowercase dono check kar rahe hain
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || (process.env as any).slack_webhook_url;
    const testKey = process.env.NEXT_PUBLIC_TEST_KEY;
    const trimmedUrl = webhookUrl?.trim();

    console.log("========== [NEURASIGHT DEBUG START] ==========");
    console.log("[1] Webhook Found:", !!webhookUrl ? "✅ YES" : "❌ NO");
    console.log("[2] Test Key Found:", !!testKey ? "✅ YES" : "❌ NO");
    if (webhookUrl) {
      console.log("[3] Webhook length:", webhookUrl.length);
      console.log("[4] Starts with:", webhookUrl.substring(0, 20) + "...");
    }
    console.log("========== [NEURASIGHT DEBUG END] ==========");

    if (!body.metric || !body.action) {
      return NextResponse.json({ error: "Missing metric/action" }, { status: 400 });
    }

    if (!trimmedUrl) {
      console.warn("[NeuraSight] Environment Variables are not being read correctly.");
      return NextResponse.json({
        success: true,
        message: "Demo Mode: Notification logged to terminal",
        debug_info: {
          webhook_missing: true,
          test_key_status: testKey || "not_found"
        },
      });
    }

    const slackPayload = buildSlackPayload(body);

    const slackResponse = await fetch(trimmedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error("Slack Fetch Error:", errorText);
      return NextResponse.json({ error: "Slack delivery failed", details: errorText }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Slack notified successfully!" });

  } catch (error) {
    console.error("Critical Execute API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}