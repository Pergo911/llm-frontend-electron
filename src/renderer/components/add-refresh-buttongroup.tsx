import React, { useCallback } from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../utils/utils';
// eslint-disable-next-line import/no-cycle
import { useRefresh } from '../App';

const AddRefreshButtonGroup = ({ handleAdd }: { handleAdd: () => void }) => {
  const refresh = useRefresh();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={refresh}>
        <RefreshCw className="h-4 w-4 flex-shrink-0" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4 flex-shrink-0" />
      </Button>
    </>
  );
};

export default AddRefreshButtonGroup;
