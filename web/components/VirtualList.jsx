'use client'

import { FixedSizeList as List } from 'react-window'

export default function VirtualList({ 
  items, 
  height = 400, 
  itemHeight = 60,
  renderItem,
  className = ""
}) {
  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-gray-500 ${className}`}>
        No items to display
      </div>
    )
  }

  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  )

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  )
}