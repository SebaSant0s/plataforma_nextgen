export const config = {
    "created_at": Date.now() ,
    "updated_at": Date.now() ,
    "name": "messaging",
    "typing_events": true,
    "read_events": true,
    "connect_events": true,
    "search": true,
    "reactions": true,
    "replies": true,
    "quotes": true,
    "mutes": true,
    "uploads": true,
    "url_enrichment": true,
    "custom_events": true,
    "push_notifications": true,
    "reminders": false,
    "mark_messages_pending": false,
    "polls": false,
    "message_retention": "infinite",
    "max_message_length": 5000,
    "automod": "disabled",
    "automod_behavior": "flag",
    "skip_last_msg_update_for_system_msgs": false,
    "commands": [
        {
            "name": "giphy",
            "description": "Post a random gif to the channel",
            "args": "[text]",
            "set": "fun_set"
        }
    ]
}

export const own_capabilities= [
    "cast-poll-vote",
    "connect-events",
    "create-attachment",
    "delete-own-message",
    "flag-message",
    "leave-channel",
    "mute-channel",
    "pin-message",
    "query-poll-votes",
    "quote-message",
    "read-events",
    "search-messages",
    "send-custom-events",
    "send-links",
    "send-message",
    "send-poll",
    "send-reaction",
    "send-reply",
    "send-typing-events",
    "typing-events",
    "update-own-message",
    "upload-file"
]