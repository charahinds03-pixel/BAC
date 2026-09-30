import { nodeStatus, type Car, type NodeState, type NodeStatus, type Tier, type TreeNode } from '../engine'

const TIER_NAMES: Record<Tier, string> = { root: 'Root', stem: 'Stem', branch: 'Branch', node: 'Node' }
const STATUS_NAMES: Record<NodeStatus, string> = { 'not-started': 'Not started', learning: 'Learning', mastered: 'Mastered' }
const CAR_NAMES: Record<Car, string> = { C: 'Conceptual', A: 'Algorithmic', R: 'Reasoning' }
const CARS: Car[] = ['C', 'A', 'R']

interface TreeRowProps {
  node: TreeNode
  state?: NodeState
  /** Share of recent answers right, per C-A-R profile, from 0 to 1. */
  car?: Partial<Record<Car, number>>
}

/** One Knowledge Tree node: title, tier, status in words and a C-A-R profile. */
export function TreeRow({ node, state, car }: TreeRowProps) {
  const status = nodeStatus(state, node)
  return (
    <li className="tree-row">
      <span className="tree-row__id">{node.id}</span>
      <div>
        <span className="tree-row__title">{node.title}</span>
        <br />
        <span className="tree-row__tier">{TIER_NAMES[node.tier]}</span>
      </div>
      <span className="tree-row__status" data-status={status}>
        {status === 'mastered' && <span className="tree-row__seal" aria-hidden="true" />}
        {STATUS_NAMES[status]}
      </span>
      {car && (
        <div className="tree-row__car">
          {CARS.map((c) => {
            const share = car[c]
            if (share === undefined) return null
            return (
              <span key={c} className="car">
                {c}
                <span className="car__track" role="img" aria-label={`${CAR_NAMES[c]}: ${Math.round(share * 100)}% right`}>
                  <span className="car__fill" style={{ width: `${Math.round(share * 100)}%` }} />
                </span>
              </span>
            )
          })}
        </div>
      )}
    </li>
  )
}
