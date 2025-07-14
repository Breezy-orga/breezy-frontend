import ConversationItem, { Conversation } from './ConversationItem'

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId?: string
}

export default function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  return (
    <ul className="space-y-2">
      {conversations.map((conv) => (
        <ConversationItem 
          key={conv._id} 
          conversation={conv} 
          currentUserId={currentUserId}
        />
      ))}
    </ul>
  )
}