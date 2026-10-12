import WorkspaceTabs from '@/components/dashboard/workspace/WorkspaceTabs'
import PlanTab from '@/components/dashboard/workspace/PlanTab'
import OrgTab from '@/components/dashboard/workspace/OrgTab'
import BoardTab from '@/components/dashboard/workspace/BoardTab'
import DocsTab from '@/components/dashboard/workspace/DocsTab'

export default function WorkspacePage() {
  return (
    <WorkspaceTabs
      plan={<PlanTab />}
      org={<OrgTab />}
      board={<BoardTab />}
      docs={<DocsTab />}
    />
  )
}
