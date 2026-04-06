import Team21 from "@/assets/images/team/team-2-1.jpg";
import Team22 from "@/assets/images/team/team-2-2.jpg";
import Team23 from "@/assets/images/team/team-2-3.jpg";
import Team24 from "@/assets/images/team/team-2-4.jpg";
import Team25 from "@/assets/images/team/team-2-5.jpg";
import Team26 from "@/assets/images/team/team-2-6.jpg";
import Team27 from "@/assets/images/team/team-2-7.jpg";
import Team28 from "@/assets/images/team/team-2-8.jpg";

export interface SocialLink {
    platform: string;
    icon: string;
    url: string;
}

export interface TeamMember {
    id: number;
    image: string;
    name: string;
    position: string;
    detailsLink: string;
    socialLinks: SocialLink[];
}

export const teamData: TeamMember[] = [
    {
        id: 1,
        image: Team21,
        name: "Alisha Martin",
        position: "Cheif Expert",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 2,
        image: Team22,
        name: "Devid Coper",
        position: "Product Designer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 3,
        image: Team23,
        name: "Naila Dev",
        position: "UI/UX Designer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 4,
        image: Team24,
        name: "Robert Martin",
        position: "CEO & Founder",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 5,
        image: Team25,
        name: "Kevin Martis",
        position: "Chief Officer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 6,
        image: Team26,
        name: "Anila Koper",
        position: "Software Engineer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 7,
        image: Team27,
        name: "Haris Rouf",
        position: "Software Engineer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    },
    {
        id: 8,
        image: Team28,
        name: "Amil Karties",
        position: "Software Engineer",
        detailsLink: "/team-details",
        socialLinks: [
            { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
            { platform: "twitter", icon: "icon-twitter-1", url: "#" },
            { platform: "pinterest", icon: "icon-pinterest", url: "#" },
            { platform: "linkedin", icon: "icon-linkedin", url: "#" }
        ]
    }
];
