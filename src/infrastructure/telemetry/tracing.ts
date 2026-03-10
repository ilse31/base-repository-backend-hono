import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { trace, Span, SpanStatusCode } from "@opentelemetry/api";

/**
 * Environment configuration for OpenTelemetry
 */
const config = {
  serviceName: process.env.OTEL_SERVICE_NAME || "clean-architecture-backend",
  serviceVersion: process.env.OTEL_SERVICE_VERSION || "1.0.0",
  jaegerEndpoint: process.env.JAEGER_ENDPOINT || "http://localhost:14268",
  otelExporterEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318",
  otelExporterProtocol:
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL || "http/protobuf",
  enabled: process.env.OTEL_ENABLED !== "false",
};

let sdk: NodeSDK | null = null;

/**
 * Initialize and configure OpenTelemetry SDK
 */
export function initOpenTelemetry(): NodeSDK | null {
  if (!config.enabled) {
    console.log("OpenTelemetry is disabled");
    return null;
  }

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: new JaegerExporter({
      endpoint: config.jaegerEndpoint,
    }),
  });

  try {
    sdk.start();
    console.log(`OpenTelemetry initialized - Service: ${config.serviceName}`);
  } catch (error) {
    console.error("Error initializing OpenTelemetry:", error);
  }

  process.on("SIGTERM", () => {
    sdk
      ?.shutdown()
      .then(() => console.log("OpenTelemetry SDK shut down successfully"))
      .catch((err) =>
        console.error("Error shutting down OpenTelemetry SDK:", err),
      )
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * Get a tracer instance for manual instrumentation
 */
export function getTracer(name?: string): ReturnType<typeof trace.getTracer> {
  return trace.getTracer(name || config.serviceName);
}

/**
 * Create a span with error handling
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name);

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  } finally {
    span.end();
  }
}

export { config as otelConfig };
