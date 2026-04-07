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

const defaultSocialLinks: SocialLink[] = [
    { platform: "facebook", icon: "icon-facebook-app-symbol", url: "#" },
    { platform: "twitter", icon: "icon-twitter-1", url: "#" },
    { platform: "pinterest", icon: "icon-pinterest", url: "#" },
    { platform: "linkedin", icon: "icon-linkedin", url: "#" }
];

export const teamData: TeamMember[] = [
    {
        id: 1,
        image: Team22,
        name: "Sanjay Kumar",
        position: "Head of Firm",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 2,
        image: Team21,
        name: "Chandrakala Devi",
        position: "Head of Finance",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 3,
        image: Team21,
        name: "Sanjana Shree",
        position: "Employee",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 4,
        image: Team24,
        name: "Gourav",
        position: "Employee",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 6,
        image: Team26,
        name: "Jyoti Verma",
        position: "Employee",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 7,
        image: Team27,
        name: "Amarjeet Kumar",
        position: "Business Partner",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 8,
        image: Team25,
        name: "Rani",
        position: "Employee",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    },
    {
        id: 9,
        image: Team21,
        name: "Pooja",
        position: "Employee",
        detailsLink: "/team-details",
        socialLinks: defaultSocialLinks
    }
];