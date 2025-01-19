import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Config } from '@/common/types';
import { toast } from 'sonner';
import { SettingsIcon } from 'lucide-react';
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';

export const SettingsModal = memo(
  ({ triggerRefresh }: { triggerRefresh: () => void }) => {
    const { setTheme: setAppTheme } = useTheme();
    const [theme, setTheme] = useState<Config['theme']>('system');
    const [baseUrl, setBaseUrl] = useState<Config['baseUrl']>('');
    const [apiKey, setApiKey] = useState<Config['apiKey']>('');
    const [saveFilePath, setSaveFilePath] =
      useState<Config['saveFilePath']>('');

    const themeFailed = useRef<Config['theme']>('system');

    useEffect(() => {
      const getConfig = async () => {
        const config = await window.electron.fileOperations.getConfig();

        setTheme(config.theme);
        themeFailed.current = config.theme;
        setBaseUrl(config.baseUrl);
        setApiKey(config.apiKey);
        setSaveFilePath(config.saveFilePath);
      };
      getConfig();
    }, []);

    const handleSave = useCallback(async () => {
      const success =
        (await window.electron.fileOperations.setConfig('theme', theme)) &&
        (await window.electron.fileOperations.setConfig('baseUrl', baseUrl)) &&
        (await window.electron.fileOperations.setConfig('apiKey', apiKey)) &&
        (await window.electron.fileOperations.setConfig(
          'saveFilePath',
          saveFilePath,
        ));

      if (success) {
        toast.success('Saved.');
      } else {
        toast.error('Failed to save settings.');
        setAppTheme(themeFailed.current);
      }
    }, [theme, baseUrl, apiKey, saveFilePath, setAppTheme]);

    const handleSaveClick = useCallback(() => {
      handleSave()
        .then(() => {
          triggerRefresh();
          return true;
        })
        .catch(() => {
          return false;
        });
    }, [handleSave, triggerRefresh]);

    return (
      <DialogContent className="max-h-[450px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <SettingsIcon className="mr-2" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Theme</Label>
            <Select
              value={theme}
              onValueChange={(value) => {
                setTheme(value as Config['theme']);
                setAppTheme(value as Config['theme']);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Base URL</Label>
            <Input
              placeholder="API base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Savefile path</Label>
            <Input
              placeholder="(w/ backslashes, no quotes)"
              value={saveFilePath}
              onChange={(e) => setSaveFilePath(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="w-fit"
                variant="secondary"
                onClick={() => {
                  setAppTheme(themeFailed.current);
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit" className="w-fit" onClick={handleSaveClick}>
                Save
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    );
  },
);
