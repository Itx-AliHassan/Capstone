import React from 'react';
import CreateTaskModal from '../task/CreateTaskModal';
import CreateProjectModal from '../project/CreateProjectModal';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import WorkspaceSettingsModal from '../workspace/WorkspaceSettingsModal';
import ImportExportModal from '../workspace/ImportExportModal';
import ProfileModal from '../settings/ProfileModal';

export const ModalsContainer = () => {
  return (
    <>
      <CreateTaskModal />
      <CreateProjectModal />
      <CreateWorkspaceModal />
      <WorkspaceSettingsModal />
      <ImportExportModal />
      <ProfileModal />
    </>
  );
};

export default ModalsContainer;
