import { motion } from 'motion/react'
import { Glass } from '../../ui/Glass'
import { Toggle } from '../../ui/Toggle'
import { cn, springs } from '../../lib/utils'
import { useDomus, type NodeId } from '../../store'
import { CleanBotIllustration, SonosIllustration, TvIllustration } from './illustrations'

const ART: Record<NodeId, typeof TvIllustration> = {
  tv: TvIllustration,
  sonos: SonosIllustration,
  cleanbot: CleanBotIllustration,
}

const STATE_LABEL: Record<NodeId, [on: string, off: string]> = {
  tv: ['Screen on', 'Standby'],
  sonos: ['Connected', 'Off'],
  cleanbot: ['Cleaning', 'Docked'],
}

function NodeTile({ id }: { id: NodeId }) {
  const node = useDomus((s) => s.nodes[id])
  const toggleNode = useDomus((s) => s.toggleNode)
  const toast = useDomus((s) => s.toast)
  const Art = ART[id]

  const onChange = (next: boolean) => {
    toggleNode(id, next)
    if (id === 'sonos') useDomus.getState().setSpeaker({ on: next, playing: next ? useDomus.getState().speaker.playing : false })
    toast({
      title: `${node.name} ${node.model}`,
      detail: next ? STATE_LABEL[id][0] : STATE_LABEL[id][1],
      tone: next ? 'success' : 'default',
    })
  }

  return (
    <Glass
      variant="well"
      radius={18}
      specular={0.7}
      whileHover={{ y: -2 }}
      transition={springs.soft}
      className="flex h-full min-h-0 min-w-0 flex-col items-center px-2 pb-3 pt-2"
    >
      <div className="relative z-[3] flex min-h-0 w-full flex-1 items-center justify-center">
        <motion.div
          className="h-full max-h-[86px] w-full"
          initial={false}
          animate={{ opacity: node.on ? 1 : 0.5, filter: node.on ? 'saturate(1) brightness(1)' : 'saturate(0.4) brightness(0.8)' }}
          transition={{ duration: 0.5 }}
        >
          <Art on={node.on} className="h-full w-full" />
        </motion.div>
      </div>
      <div
        className={cn(
          'relative z-[3] mt-1 text-center text-[11.5px] leading-[1.25] transition-colors duration-500',
          node.on ? 'text-white/85' : 'text-white/50',
        )}
      >
        <div className="truncate">{node.name}</div>
        <div className="truncate">{node.model}</div>
      </div>
      <div className="relative z-[3] mt-2.5">
        <Toggle checked={node.on} onChange={onChange} label={`${node.name} ${node.model}`} />
      </div>
    </Glass>
  )
}

export function NodesGrid() {
  return (
    <Glass variant="inset" radius={26} className="flex h-full w-full flex-col px-3 pb-3 pt-[15px]" style={{ background: 'linear-gradient(150deg, rgb(255 255 255 / 0.1) 0%, rgb(38 36 33 / 0.16) 100%)' }}>
      <div className="relative z-[3] px-1.5 text-[13px] leading-none text-white/80">Nodes connected in a room</div>
      <div className="relative z-[3] mt-3 grid min-h-0 flex-1 grid-cols-3 gap-2.5">
        <NodeTile id="tv" />
        <NodeTile id="sonos" />
        <NodeTile id="cleanbot" />
      </div>
    </Glass>
  )
}
