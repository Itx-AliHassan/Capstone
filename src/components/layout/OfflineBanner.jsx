import React from 'react';
import useOfflineSync from '../../hooks/useOfflineSync';
import SyncIcon from '@mui/icons-material/Sync';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export const OfflineBanner = () => {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-amber-500 text-white text-xs px-4 py-2 font-medium flex items-center justify-between shadow-md z-40 transition-all">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOffIcon fontSize="inherit" />
            <span>
              <strong>You are working offline.</strong> All changes are safely queued in IndexedDB.
            </span>
          </>
        ) : (
          <>
            <SyncIcon fontSize="inherit" className={isSyncing ? 'animate-spin' : ''} />
            <span>
              <strong>Connection active.</strong> {pendingCount} offline change(s) ready to sync.
            </span>
          </>
        )}
      </div>

      {isOnline && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-2.5 py-1 bg-white text-amber-600 rounded-md font-semibold hover:bg-amber-50 active:scale-95 transition-all text-xs flex items-center gap-1"
        >
          <SyncIcon fontSize="inherit" className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;
