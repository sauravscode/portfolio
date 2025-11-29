// ========================================
// DATA CONFIGURATION
// ========================================

const expData = [
    {
        company: "CloudCorp",
        role: "Senior Infra Engineer",
        time: "2023-NOW",
        desc: "Leading Kubernetes migration. Architecting scalable AWS solutions. Reduced deployment latency by 60%."
    },
    {
        company: "TechFlow",
        role: "Software Engineer",
        time: "2021-2023",
        desc: "Microservices in Go & gRPC. CI/CD pipeline ownership for 50+ dev team."
    },
    {
        company: "StartUp Inc",
        role: "DevOps Engineer",
        time: "2019-2021",
        desc: "Linux fleet management. Terraform & Ansible automation."
    }
];

const projData = [
    {
        id: 1,
        title: "KubeGuard",
        desc: "Security scanning for K8s.",
        stack: ["GO", "K8S", "AWS"],
        full: "Automated security scanning integration for CI/CD pipelines. Detects misconfigurations before they reach production.",
        github: "https://github.com/yourusername/kubeguard"
    },
    {
        id: 2,
        title: "MeshNet",
        desc: "Service mesh from scratch.",
        stack: ["RUST", "GRPC"],
        full: "Lightweight service mesh implementation to study sidecar proxies, mTLS, and traffic shifting strategies.",
        github: "https://github.com/yourusername/meshnet"
    },
    {
        id: 3,
        title: "LogStream",
        desc: "Distributed logging.",
        stack: ["JAVA", "KAFKA"],
        full: "Petabyte scale log ingestion system using Kafka and Elasticsearch for real-time observability.",
        github: "https://github.com/yourusername/logstream"
    },
    {
        id: 4,
        title: "InfraBot",
        desc: "Slack ChatOps.",
        stack: ["PYTHON", "LAMBDA"],
        full: "Serverless bot for managing ephemeral environments via chat. Handles automated teardowns and cost estimation.",
        github: "https://github.com/yourusername/infrabot"
    },
    {
        id: 5,
        title: "ChaosMonkey",
        desc: "Resilience testing.",
        stack: ["GO", "DOCKER"],
        full: "Randomly terminates pods and injects network latency to test system recovery capabilities.",
        github: "https://github.com/yourusername/chaosmonkey"
    }
];

const photoData = [
    {
        title: "TOKYO",
        location: "JP",
        url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80",
        alt: "Tokyo cityscape",
        size: "large" // 2x1
    },
    {
        title: "MOUNTAIN_PEAK",
        location: "CH",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
        alt: "Mountain peak at sunrise",
        size: "small" // 1x1
    },
    {
        title: "URBAN_LIGHTS",
        location: "NYC",
        url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
        alt: "Urban night lights",
        size: "tall" // 1x2
    },
    {
        title: "OCEAN_WAVES",
        location: "AUS",
        url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&q=80",
        alt: "Ocean waves crashing",
        size: "small" // 1x1
    },
    {
        title: "FOREST_PATH",
        location: "CAN",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
        alt: "Foggy forest path",
        size: "wide" // 2x1
    },
    {
        title: "CITY_SKYLINE",
        location: "SG",
        url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
        alt: "Singapore skyline",
        size: "small" // 1x1
    },
    {
        title: "DESERT_DUNES",
        location: "UAE",
        url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=600&q=80",
        alt: "UAE desert dunes",
        size: "tall" // 1x2
    },
    {
        title: "STREET_ART",
        location: "MEX",
        url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80",
        alt: "Colorful street art",
        size: "small" // 1x1
    },
    {
        title: "NORTHERN_LIGHTS",
        location: "ISL",
        url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80",
        alt: "Aurora borealis",
        size: "wide" // 2x1
    },
    {
        title: "ARCHITECTURE",
        location: "ITA",
        url: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80",
        alt: "Modern architecture",
        size: "small" // 1x1
    }
];

const booksReading = [
    {
        title: "Designing Data-Intensive Apps",
        author: "M. Kleppmann"
    },
    {
        title: "SRE Handbook",
        author: "Google"
    }
];

const booksDone = [
    {
        title: "The Phoenix Project",
        author: "G. Kim"
    },
    {
        title: "Clean Code",
        author: "R. Martin"
    },
    {
        title: "Dune",
        author: "F. Herbert"
    }
];