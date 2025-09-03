import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Config } from '@/common/types';
import { toast } from 'sonner';
import {
  FileJson,
  Monitor,
  Moon,
  Settings2,
  SettingsIcon,
  Sun,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '../utils/utils';

export const SettingsModal = memo(
  ({
    triggerRefresh,
    onSetOpen,
    open,
  }: {
    triggerRefresh: () => void;
    onSetOpen: (v: boolean) => void;
    open: boolean;
  }) => {
    const { setTheme: setAppTheme } = useTheme();
    const [theme, setTheme] = useState<Config['theme']>('system');
    const [useLegacyRoleNames, setUseLegacyRoleNames] =
      useState<Config['useLegacyRoleNames']>(false);
    const [baseUrl, setBaseUrl] = useState<Config['baseUrl']>('');
    const [apiKey, setApiKey] = useState<Config['apiKey']>('');
    const [saveFilePath, setSaveFilePath] =
      useState<Config['saveFilePath']>('');
    const [configLoaded, setConfigLoaded] = useState(false);

    const themeFailed = useRef<Config['theme']>('system');

    const handleSave = useCallback(async () => {
      const e: Array<string | null> = [];

      e.push(
        (await window.electron.fileOperations.setConfig('theme', theme)).error,
      );

      e.push(
        (
          await window.electron.fileOperations.setConfig(
            'useLegacyRoleNames',
            useLegacyRoleNames,
          )
        ).error,
      );

      e.push(
        (await window.electron.fileOperations.setConfig('baseUrl', baseUrl))
          .error,
      );

      e.push(
        (await window.electron.fileOperations.setConfig('apiKey', apiKey))
          .error,
      );

      e.push(
        (
          await window.electron.fileOperations.setConfig(
            'saveFilePath',
            saveFilePath,
          )
        ).error,
      );

      // remove successful saves and duplicates
      const error = [...new Set(e.filter((a) => a != null))];

      if (error.length === 0) {
        toast.success('Saved.');
      } else {
        toast.error(`Failed to save settings: ${error.toString()}`);
        setAppTheme(themeFailed.current);
      }
    }, [theme, useLegacyRoleNames, baseUrl, apiKey, saveFilePath, setAppTheme]);

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

    // First effect: load configuration.
    useEffect(() => {
      const getConfig = async () => {
        const config = await window.electron.fileOperations.getConfig();
        setTheme(config.theme);
        themeFailed.current = config.theme;
        setUseLegacyRoleNames(config.useLegacyRoleNames);
        setBaseUrl(config.baseUrl);
        setApiKey(config.apiKey);
        setSaveFilePath(config.saveFilePath);
        setConfigLoaded(true);
      };

      getConfig();
    }, []);

    // Second effect: register keydown event after configuration has loaded.
    useEffect(() => {
      if (!configLoaded) return;
      if (!open) return;

      const handleSaveWithCtrlEnter = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
          handleSaveClick();
          onSetOpen(false);
        }
      };

      window.addEventListener('keydown', handleSaveWithCtrlEnter);

      // eslint-disable-next-line consistent-return
      return () => {
        window.removeEventListener('keydown', handleSaveWithCtrlEnter);
      };
    }, [configLoaded, handleSaveClick, onSetOpen, open]);

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings2 className="mr-2" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[400px] flex-col gap-4 overflow-y-auto pl-[1px] pr-2">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label>System role name</Label>
              <Select
                value={useLegacyRoleNames ? 'true' : 'false'}
                onValueChange={(value) =>
                  setUseLegacyRoleNames(value === 'true')
                }
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">
                    <span className="font-mono">&quot;developer&quot;</span>{' '}
                    <span className="text-muted-foreground">(Default)</span>
                  </SelectItem>
                  <SelectItem value="true">
                    <span className="font-mono">&quot;system&quot;</span>{' '}
                    <span className="text-muted-foreground">(Legacy)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Theme</Label>
              <Tabs
                value={theme}
                onValueChange={(v) => {
                  setTheme(v as 'system' | 'light' | 'dark');
                  setAppTheme(v as 'system' | 'light' | 'dark');
                }}
              >
                <TabsList>
                  <TabsTrigger value="system">
                    <Monitor className="h-4 w-4 flex-shrink-0" />
                  </TabsTrigger>
                  <TabsTrigger value="light">
                    <Sun className="h-4 w-4 flex-shrink-0" />
                  </TabsTrigger>
                  <TabsTrigger value="dark">
                    <Moon className="h-4 w-4 flex-shrink-0" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
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
            <div className="flex gap-2">
              <div
                className={cn(
                  saveFilePath === '' && 'opacity-50',
                  'flex h-9 w-full min-w-0 flex-[4] items-center rounded-xl border border-border bg-transparent px-3 py-1 shadow-sm transition-colors md:text-sm',
                )}
              >
                <FileJson className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {saveFilePath === '' ? 'No savefile' : saveFilePath}
                </span>
              </div>
              <Button
                className="w-full flex-[1]"
                variant="outline"
                onClick={async () => {
                  const { canceled, filePath } =
                    await window.electron.fileOperations.openSaveFilePickerModal();

                  if (!canceled && filePath) {
                    setSaveFilePath(filePath);
                  }
                }}
              >
                Browse
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-fit" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="submit" className="w-fit" onClick={handleSaveClick}>
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    );
  },
);
