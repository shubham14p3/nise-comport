import Project21 from "@/assets/images/project/project-2-1.jpg";
import Project22 from "@/assets/images/project/project-2-2.jpg";
import Project23 from "@/assets/images/project/project-2-3.jpg";
import Project24 from "@/assets/images/project/project-2-4.jpg";
import Project25 from "@/assets/images/project/project-2-5.jpg";
import Project26 from "@/assets/images/project/project-2-6.jpg";
import Project27 from "@/assets/images/project/project-2-7.jpg";
import Project28 from "@/assets/images/project/project-2-8.jpg";

export interface Project {
    id: number;
    image: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    link: string;
    delay: number;
}

export const projectsData: Project[] = [
    {
        id: 1,
        image: Project21,
        imageUrl: "assets/images/project/project-2-1.jpg",
        title: "UI/UX Development",
        subtitle: "Technology",
        link: "/project-details",
        delay: 100
    },
    {
        id: 2,
        image: Project22,
        imageUrl: "assets/images/project/project-2-2.jpg",
        title: "Fee Payment",
        subtitle: "Technology",
        link: "/project-details",
        delay: 200
    },
    {
        id: 3,
        image: Project23,
        imageUrl: "assets/images/project/project-2-3.jpg",
        title: "Product Development",
        subtitle: "Technology",
        link: "/project-details",
        delay: 300
    },
    {
        id: 4,
        image: Project24,
        imageUrl: "assets/images/project/project-2-4.jpg",
        title: "Digital Experience",
        subtitle: "Technology",
        link: "/project-details",
        delay: 400
    },
    {
        id: 5,
        image: Project25,
        imageUrl: "assets/images/project/project-2-5.jpg",
        title: "Form Filing",
        subtitle: "Technology",
        link: "/project-details",
        delay: 500
    },
    {
        id: 6,
        image: Project26,
        imageUrl: "assets/images/project/project-2-6.jpg",
        title: "Cloud Computing",
        subtitle: "Technology",
        link: "/project-details",
        delay: 600
    },
    {
        id: 7,
        image: Project27,
        imageUrl: "assets/images/project/project-2-7.jpg",
        title: "Software Service",
        subtitle: "Technology",
        link: "/project-details",
        delay: 700
    },
    {
        id: 8,
        image: Project28,
        imageUrl: "assets/images/project/project-2-8.jpg",
        title: "SEO Optimization",
        subtitle: "Technology",
        link: "/project-details",
        delay: 800
    }
];
