``` mermaid
erDiagram

    users {
        ObjectId _id
        string email
        string passwordHash
        array roles
        object twoFA
        object profile
        object plan
        date createdAt
        date updatedAt
    }

    rate_limits {
        string key
        int count
        date resetAt
    }

    short_urls {
        ObjectId _id
        ObjectId ownerId
        string shortCode
        string slug
        string type
        string defaultRedirectUrl
        object settings
        array links
        int clicksCount
        date createdAt
        date updatedAt
    }

    sessions {
        ObjectId _id
        ObjectId userId
        string refreshTokenHash
        object deviceInfo
        date createdAt
        date expiresAt
    }

    api_keys {
        ObjectId _id
        ObjectId ownerId
        string keyId
        string secretHash
        array scopes
        object createdAt
        date lastUsedAt
        bool revoked
    }

    audit_logs {
        ObjectId _id
        string action
        ObjectId userId
        string targetCollection
        ObjectId targetId
        object meta
        date timestamp
    }

    refresh_tokens {
        ObjectId _id
        ObjectId userId
        string refreshTokenHash
        date createdAt
        date expiresAt
        bool revoked
    }

    links {
        ObjectId _id
        ObjectId shortUrlId
        string title
        string url
        int position
        bool visible
        date createdAt
        date updatedAt
    }

    clicks {
        ObjectId _id
        ObjectId shortUrlId
        string linkId
        date timestamp
        string ip
        string geo
        object device
        string referer
        string utm
        bool isBot
        date createdAt
    }

    qr_codes {
        ObjectId _id
        ObjectId shortUrlId
        string format
        int size
        string storageUrl
        string hash
        date generatedAt
    }

    analytics_daily {
        string _id
        ObjectId shortUrlId
        string date
        int totalClicks
        array topCountries
        array topBrowsers
    }

    analytics_hourly {
        string _id
        ObjectId shortUrlId
        string hour
        int totalClicks
    }

    %% RELATIONSHIPS
    users ||--o{ short_urls : "ownerId"
    users ||--o{ sessions : "userId"
    users ||--o{ api_keys : "ownerId"
    users ||--o{ audit_logs : "userId"
    users ||--o{ refresh_tokens : "userId"

    short_urls ||--o{ links : "shortUrlId"
    short_urls ||--o{ clicks : "shortUrlId"
    short_urls ||--o{ qr_codes : "shortUrlId"
    short_urls ||--o{ analytics_daily : "shortUrlId"
    short_urls ||--o{ analytics_hourly : "shortUrlId"

```