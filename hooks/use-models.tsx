import { ModelsController, OpenRouterModel } from "@/utils/types";
import { useCallback, useEffect, useState } from "react";
import { OpenAIHandler } from "../utils/openai";

export const useModels = (): {
  controller: ModelsController;
  models: OpenRouterModel[] | null;
  modelSelection: OpenRouterModel[] | null;
  loading: boolean;
  error: string | null;
} => {
  const [models, setModels] = useState<OpenRouterModel[] | null>(null);
  const [modelSelection, setModelSelection] = useState<OpenRouterModel[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setModels(null);
    setModelSelection(null);
    setLoading(true);
    setError(null);

    try {
      const config = await window.electron.fileOperations.getConfig();
      const openAI = await OpenAIHandler.get();

      const rawList = (await openAI.models.list()).data.map((m) => {
        // @ts-ignore
        const reasoning = m.supported_parameters.includes("reasoning");
        return {
          id: m.id,
          // @ts-ignore
          name: m.name,
          reasoning,
          // If reasoning is not supported (false),
          // reasoning_preference will be ignored either way
          reasoning_preference: reasoning,
        } as OpenRouterModel;
      });

      const storedModels = config.modelSelection;

      // Remove stored models that are no longer available
      const models = storedModels.filter((m) => rawList.some((r) => r.id === m.id));

      // Add new models to the list
      rawList.forEach((m) => {
        // Check if the model is already in the list
        if (models.every((existing) => existing.id !== m.id)) {
          models.push(m);
        }
      });

      // If no model is read from config, select one
      if (storedModels.length === 0) {
        storedModels.push(models[0]);
        const { error } = await window.electron.fileOperations.setConfig("modelSelection", [...storedModels]);

        if (error) throw new Error(error);
      }

      setModels(models);
      setLoading(false);
      setModelSelection(config.modelSelection);
      setError(null);
    } catch (e) {
      setLoading(false);
      setError(`${e as Error}`);
      setModels(null);
      setModelSelection(null);
    }
  }, []);

  const reload = () => {
    setLoading(true);
  };

  useEffect(() => {
    if (loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const select = useCallback(
    async (model: OpenRouterModel): Promise<{ error: string | null }> => {
      if (!modelSelection || !models) {
        return { error: "Model selection or models not loaded" };
      }

      // Remove model from current position if it exists
      const modelSelectionIndex = modelSelection.findIndex((m) => m.id === model.id);
      const modelsIndex = models.findIndex((m) => m.id === model.id);

      if (modelSelectionIndex !== -1) {
        modelSelection.splice(modelSelectionIndex, 1);
      }

      if (modelsIndex !== -1) {
        models.splice(modelsIndex, 1);
      }

      // Add model to beginning of array
      modelSelection.unshift(model);

      // Add model to the beginning of the models array
      models.unshift(model);

      // We will have made this change to `models` whether writing
      // to disk succeeds or not, so we can update the state immediately
      setModels([...models]);

      // Update config
      const { error } = await window.electron.fileOperations.setConfig("modelSelection", [...modelSelection]);

      if (error) {
        return { error };
      }

      // Update state
      setModelSelection([...modelSelection]);

      return { error: null };
    },
    [modelSelection, models]
  );

  const toggleReasoningPreference = useCallback(
    async (enabled: boolean): Promise<{ error: string | null }> => {
      if (!modelSelection || !models) {
        return { error: "Model selection or models not loaded" };
      }

      modelSelection[0].reasoning_preference = enabled;
      models[0].reasoning_preference = enabled;

      setModels([...models]);

      const { error } = await window.electron.fileOperations.setConfig("modelSelection", [...modelSelection]);

      if (error) {
        return { error };
      }

      // Update state
      setModelSelection([...modelSelection]);
      return { error: null };
    },
    [modelSelection, models]
  );

  const controller: ModelsController = {
    reload,
    select,
    toggleReasoningPreference,
  };

  return {
    controller,
    models,
    modelSelection,
    loading,
    error,
  };
};
