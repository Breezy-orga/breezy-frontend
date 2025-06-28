import ConversationItem, { Conversation } from './ConversationItem'

interface ConversationListProps {
  conversations: Conversation[]
}

export default function ConversationList({ conversations }: ConversationListProps) {
  return (
    <ul className="space-y-2">
      {conversations.map((conv) => (
        <ConversationItem key={conv._id} conversation={conv} />
      ))}
    </ul>
  )
}