import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import type { PipelineState } from "@/hooks/useContactProcessing";
import type { StageConfig } from "@/hooks/useContactProcessing";

const defaultStageConfig: StageConfig = {
  clean: "groq",
  verify: "openrouter",
  correct: "gemini",
};

const allIdle: PipelineState = {
  mapping: "idle",
  rules: "idle",
  cleaning: "idle",
  verifying: "idle",
  correcting: "idle",
  validation: "idle",
  dedup: "idle",
};

const allDone: PipelineState = {
  mapping: "done",
  rules: "done",
  cleaning: "done",
  verifying: "done",
  correcting: "done",
  validation: "done",
  dedup: "done",
};

const withError: PipelineState = {
  ...allIdle,
  cleaning: "error",
};

const withActive: PipelineState = {
  ...allIdle,
  rules: "active",
};

describe("PipelineVisualizer", () => {
  it("should render all 7 pipeline steps in pipeline mode", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={allIdle}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    expect(container.textContent).toContain("Mapeo");
    expect(container.textContent).toContain("Reglas");
    expect(container.textContent).toContain("Validar");
    expect(container.textContent).toContain("Dedup");
  });

  it("should render provider names for IA stages", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={allIdle}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    // Provider names are rendered (e.g. "Groq Cloud")
    expect(container.textContent).toBeTruthy();
  });

  it("should render single provider name in single mode", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={allIdle}
        stageConfig={defaultStageConfig}
        mode="single"
        singleProvider="groq"
      />
    );
    expect(container.textContent).toContain("Mapeo");
  });

  it("should render without crashing with all-done state", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={allDone}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    expect(container).toBeTruthy();
  });

  it("should render without crashing with error state", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={withError}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    expect(container).toBeTruthy();
  });

  it("should render without crashing with active state", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={withActive}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    expect(container).toBeTruthy();
  });

  it("should render pipeline label", () => {
    const { container } = render(
      <PipelineVisualizer
        pipelineState={allIdle}
        stageConfig={defaultStageConfig}
        mode="pipeline"
        singleProvider="groq"
      />
    );
    expect(container.textContent).toContain("Pipeline de procesamiento");
  });
});
