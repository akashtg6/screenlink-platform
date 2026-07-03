'use client'

/**
 * Sprint 6A — Cabinet shape (a single placed node).
 *
 * Renders a rounded rectangle with a coloured header strip + name + optional
 * sub-label. Selected shapes get a highlight stroke. Draggable when the layer
 * & node are unlocked.
 */

import * as React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { ACCENT_HEX, SELECTION_STROKE } from '../constants'
import type { WorkspaceNode } from '../types'

export interface CabinetShapeProps {
  node: WorkspaceNode
  selected: boolean
  locked: boolean
  onSelect: (id: string, additive: boolean) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onDragMove?: (id: string, x: number, y: number) => void
  scale: number
}

const CabinetShapeInner: React.FC<CabinetShapeProps> = ({
  node, selected, locked, onSelect, onDragEnd, onDragMove, scale,
}) => {
  const accent = node.meta?.accent ?? 'slate'
  const palette = ACCENT_HEX[accent]

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onSelect(node.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(node.id, e.target.x(), e.target.y())
  }
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragMove?.(node.id, e.target.x(), e.target.y())
  }

  // Header height in world mm — scales inversely so it stays legible at any zoom.
  const headerH = Math.min(72, Math.max(28, 40 / Math.max(0.6, scale)))
  const bodyH = Math.max(2, node.height - headerH)

  return (
    <Group
      id={node.id}
      name="node"
      x={node.x}
      y={node.y}
      rotation={node.rotation}
      draggable={!locked}
      opacity={node.visible ? 1 : 0.15}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      offsetX={0}
      offsetY={0}
    >
      {/* Body */}
      <Rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        fill={palette.bg}
        stroke={selected ? SELECTION_STROKE : palette.border}
        strokeWidth={selected ? 3 / scale : 1.5 / scale}
        cornerRadius={4 / scale}
        shadowColor={selected ? SELECTION_STROKE : 'black'}
        shadowBlur={selected ? 12 / scale : 4 / scale}
        shadowOpacity={selected ? 0.5 : 0.25}
        perfectDrawEnabled={false}
      />
      {/* Coloured header strip */}
      <Rect
        x={0}
        y={0}
        width={node.width}
        height={headerH}
        fill={palette.border}
        opacity={0.16}
        cornerRadius={[4 / scale, 4 / scale, 0, 0]}
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* Name */}
      <Text
        x={12 / scale}
        y={8 / scale}
        text={node.name}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={Math.min(node.width * 0.09, 26 / scale)}
        fontStyle="600"
        fill={palette.text}
        listening={false}
        width={node.width - 24 / scale}
        ellipsis
        wrap="none"
      />
      {/* Sub-label */}
      {node.meta?.pixelPitchMm != null && (
        <Text
          x={12 / scale}
          y={headerH + 8 / scale}
          text={`${node.meta.pixelPitchMm}mm pitch`}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={Math.min(node.width * 0.06, 18 / scale)}
          fill={palette.text}
          opacity={0.7}
          listening={false}
        />
      )}
      {node.meta?.resolution && (
        <Text
          x={12 / scale}
          y={node.height - 22 / scale}
          text={node.meta.resolution}
          fontFamily="ui-monospace, monospace"
          fontSize={Math.min(node.width * 0.055, 14 / scale)}
          fill={palette.text}
          opacity={0.55}
          listening={false}
        />
      )}
      {/* Size label — only for larger cabinets so it isn't crowded */}
      {node.width > 250 && bodyH > 60 && (
        <Text
          x={node.width - 12 / scale}
          y={node.height - 22 / scale}
          text={`${Math.round(node.width)}×${Math.round(node.height)}mm`}
          fontFamily="ui-monospace, monospace"
          fontSize={Math.min(node.width * 0.05, 13 / scale)}
          fill={palette.text}
          opacity={0.4}
          align="right"
          width={node.width - 24 / scale}
          offsetX={node.width - 24 / scale}
          listening={false}
        />
      )}
      {/* Lock badge */}
      {locked && (
        <Rect
          x={node.width - 14 / scale}
          y={4 / scale}
          width={10 / scale}
          height={10 / scale}
          fill={palette.border}
          cornerRadius={2 / scale}
          listening={false}
        />
      )}
    </Group>
  )
}

export const CabinetShape = React.memo(CabinetShapeInner)
