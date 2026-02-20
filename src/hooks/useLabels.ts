import { useEffect, useState, useCallback } from 'react';
import { Label } from '../types';
import { StorageService, DEFAULT_LABEL_ID } from '../services/storage';

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
   * Garante que existe um label padrão
   * (Executa apenas uma vez após o carregamento inicial para evitar loops)
   */
  useEffect(() => {
    if (loading) return;

    setLabels(prev => {
      let defaultLabel = prev.find(l => l.isDefault);
      
      // Se não achou por flag, tenta achar pelo ID fixo
      if (!defaultLabel) {
        defaultLabel = prev.find(l => l.id === DEFAULT_LABEL_ID);
        
        // Se achou pelo ID mas flag estava false, corrige
        if (defaultLabel) {
          const fixedLabel = { ...defaultLabel, isDefault: true };
          return prev.map(l => l.id === DEFAULT_LABEL_ID ? fixedLabel : l);
        } else {
          // Se realmente não existe, cria
          const newDefault = StorageService.createDefaultLabel();
          // Verifica novamente por segurança se já não existe com ID
          if (prev.some(l => l.id === DEFAULT_LABEL_ID)) return prev;
          return [newDefault, ...prev];
        }
      }
      return prev;
    });
  }, [loading]);

  /**
   * Obtém o label padrão (apenas leitura segura)
   */
  const getDefaultLabel = useCallback((): Label => {
    return labels.find(l => l.isDefault) || 
           labels.find(l => l.id === DEFAULT_LABEL_ID) ||
           StorageService.createDefaultLabel();
  }, [labels]);

  /**
   * Adiciona um label importado (de um compartilhamento)
   * Para label padrão: mescla os todos com o padrão local existente
   */
  const importLabel = useCallback((label: Label) => {
    // Se for label padrão, retorna o ID do padrão local (não cria novo)
    if (label.isDefault || label.id === DEFAULT_LABEL_ID) {
      const defaultLabel = labels.find(l => l.isDefault) || labels.find(l => l.id === DEFAULT_LABEL_ID); // Tenta achar por flag OU id
      
      if (defaultLabel) {
        // Garante que está marcado como default se achou pelo ID
        if (!defaultLabel.isDefault) {
           updateLabel(defaultLabel.id, { isDefault: true });
        }

        // Atualiza metadata do padrão local se vier do Drive
        if (label.driveMetadata) {
          updateLabel(defaultLabel.id, { driveMetadata: label.driveMetadata });
        }
        return defaultLabel.id;
      }
      // Se não existe padrão local (não deveria acontecer), cria
      const newDefault = StorageService.createDefaultLabel();
      setLabels(prev => {
         // Check duplicatas
         if (prev.some(l => l.id === DEFAULT_LABEL_ID)) return prev;
         return [newDefault, ...prev];
      });
      return newDefault.id;
    }
    
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

  /**
   * Substitui todos os labels (usado ao restaurar backup)
   */
  const replaceAllLabels = useCallback((newLabels: Label[]) => {
    setLabels(newLabels);
  }, []);

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
    replaceAllLabels,
  };
};
