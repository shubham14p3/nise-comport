import Testimonial11 from "@/assets/images/testimonial/testimonial-1-1.jpg";
import Testimonial12 from "@/assets/images/testimonial/testimonial-1-2.jpg";
import Testimonial13 from "@/assets/images/testimonial/testimonial-1-3.jpg";

import TestimonialThree11 from "@/assets/images/testimonial/testimonial-three-1-1.png";
import TestimonialThree12 from "@/assets/images/testimonial/testimonial-three-1-2.png";
import TestimonialThree13 from "@/assets/images/testimonial/testimonial-three-1-3.png";

import TestimonialThreeThamb11 from "@/assets/images/testimonial/testimonial-three-thamb-1-1.jpg";
import TestimonialThreeThamb12 from "@/assets/images/testimonial/testimonial-three-thamb-1-2.jpg";
import TestimonialThreeThamb13 from "@/assets/images/testimonial/testimonial-three-thamb-1-3.jpg";

export interface Testimonial {
    id: number;
    image: string;
    bigImage?: string;
    thumbImage?: string;
    name: string;
    designation: string;
    text: string;
    rating: number;
}

export const testimonialsData: Testimonial[] = [
    {
        id: 1,
        image: Testimonial11,
        bigImage: TestimonialThree11,
        thumbImage: TestimonialThreeThamb11,
        name: "Thomas Alison",
        designation: "UI/UX Designer",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
    {
        id: 2,
        image: Testimonial12,
        bigImage: TestimonialThree12,
        thumbImage: TestimonialThreeThamb12,
        name: "Sarah Williams",
        designation: "Marketing Manger",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
    {
        id: 3,
        image: Testimonial13,
        bigImage: TestimonialThree13,
        thumbImage: TestimonialThreeThamb13,
        name: "James Anderson",
        designation: "CEO at Anaton",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
    {
        id: 4,
        image: Testimonial11,
        bigImage: TestimonialThree11,
        thumbImage: TestimonialThreeThamb11,
        name: "Thomas Alison",
        designation: "UI/UX Designer",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
    {
        id: 5,
        image: Testimonial12,
        bigImage: TestimonialThree12,
        thumbImage: TestimonialThreeThamb12,
        name: "Sarah Williams",
        designation: "Marketing Manger",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
    {
        id: 6,
        image: Testimonial13,
        bigImage: TestimonialThree13,
        thumbImage: TestimonialThreeThamb13,
        name: "James Anderson",
        designation: "CEO at Anaton",
        text: "Absolutely fantastic experience! The team exceeded our expectations and delivered a solution that perfectly met our needs. Their attention to detail and commitment to quality is unmatched.",
        rating: 3
    },
];
