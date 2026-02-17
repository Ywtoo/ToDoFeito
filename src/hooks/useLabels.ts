import { useEffect, useState, useCallback } from 'react';
import { Label } from '../types';
import { StorageService } from '../services/storage';

export const useLabels = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega labels do storage
  useEffect(() => {
    const load = async () => {
      const loaded = await StorageService.loadLabels();
      setLabels(loaded);
      setLoading(false);
    };
    load();
  }, []);

  // Salva labels automaticamente quando mudam
  useEffect(() => {
    if (!loading) {
      StorageService.saveLabels(labels);
    }
  }, [labels, loading]);

  /**
   * Cria um novo label
   */
  const createLabel = useCallback((name: string, color: string = '#2196F3'): Label => {
    const newLabel: Label = {
      id: `label-${Date.now()}`,
      name,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
      shared: false,
    };

    setLabels(prev => [...prev, newLabel]);
    return newLabel;
  }, []);

  /**
   * Atualiza um label existente
   */
  const updateLabel = useCallback((labelId: string, updates: Partial<Label>) => {
    setLabels(prev =>
      prev.map(label =>
        label.id === labelId
          ? { ...label, ...updates, updatedAt: Date.now() }
          : label
      )
    );
  }, []);

  /**
   * Deleta um label (exceto o padrão)
   */
  const deleteLabel = useCallback((labelId: string) => {
    setLabels(prev => prev.filter(label => label.id !== labelId && !label.isDefault));
  }, []);

  /**
   * Obtém um label por ID
   */
  const getLabel = useCallback(
    (labelId: string): Label | undefined => {
      return labels.find(l => l.id === labelId);
    },
    [labels]
  );

  /**
   * Obtém o label padrão
   */
  const getDefaultLabel = useCallback((): Label => {
    const defaultLabel = labels.find(l => l.isDefault);
    if (!defaultLabel) {
      // Se não existe, cria
      const newDefault = StorageService.createDefaultLabel();
      setLabels(prev => [newDefault, ...prev]);
      return newDefault;
    }
    return defaultLabel;
  }, [labels]);

  /**
   * Adiciona um label importado (de um compartilhamento)
   */
  const importLabel = useCallback((label: Label) => {
    // Verifica se já existe um label com esse driveMetadata
    const existing = labels.find(
      l => l.driveMetadata?.folderId === label.driveMetadata?.folderId
    );

    if (existing) {
      // Atualiza o existente
      updateLabel(existing.id, label);
      return existing.id;
    } else {
      // Adiciona novo
      const importedLabel: Label = {
        ...label,
        id: `label-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setLabels(prev => [...prev, importedLabel]);
      return importedLabel.id;
    }
  }, [labels, updateLabel]);

  /**
   * Atualiza driveMetadata de um label
   */
  const updateDriveMetadata = useCallback(
    (
      labelId: string,
      driveMetadata: Label['driveMetadata']
    ) => {
      updateLabel(labelId, { driveMetadata });
    },
    [updateLabel]
  );

  return {
    labels,
    loading,
    createLabel,
    updateLabel,
    deleteLabel,
    getLabel,
    getDefaultLabel,
    importLabel,
    updateDriveMetadata,
  };
};
