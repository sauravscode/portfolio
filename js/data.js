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
        alt: "Tokyo cityscape"
    },
    {
        title: "HK_NIGHT",
        location: "HK",
        url: "https://images.unsplash.com/photo-1506318137071-a8bcbf67117d?w=600&q=80",
        alt: "Hong Kong night view"
    },
    {
        title: "ALPS",
        location: "CH",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
        alt: "Swiss Alps mountains"
    },
    {
        title: "DESERT",
        location: "UAE",
        url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=600&q=80",
        alt: "UAE desert dunes"
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