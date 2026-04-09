import { isOptOutMessage, getAIDisclaimer, getOptOutResponse, COMPLIANCE_RULES } from "./prompts/response-rules";

export interface ComposeResponseParams {
  responseText: string;
  businessName: string;
  isFirstMessage: boolean;
  inboundContent: string;
}

export interface ComposedResponse {
  content: string;
  isOptOut: boolean;
  shouldSend: boolean;
}

export function composeResponse(params: ComposeResponseParams): ComposedResponse {
  const { responseText, businessName, isFirstMessage, inboundContent } = params;

  // Check for opt-out
  if (isOptOutMessage(inboundContent)) {
    return {
      content: getOptOutResponse(),
      isOptOut: true,
      shouldSend: true,
    };
  }

  let content = responseText;

  // Prepend AI disclaimer on first message (Australian compliance)
  if (isFirstMessage && COMPLIANCE_RULES.mustIdentifyAsAI) {
    content = `${getAIDisclaimer(businessName)}\n\n${content}`;
  }

  // Truncate if too long
  if (content.length > COMPLIANCE_RULES.maxResponseLength) {
    content = content.slice(0, COMPLIANCE_RULES.maxResponseLength - 3) + "...";
  }

  return {
    content,
    isOptOut: false,
    shouldSend: true,
  };
}
