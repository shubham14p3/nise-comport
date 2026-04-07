import Services21 from "@/assets/images/services/services-2-1.jpg";
import Services22 from "@/assets/images/services/services-2-2.jpg";
import Services23 from "@/assets/images/services/services-2-3.jpg";
import Services24 from "@/assets/images/services/services-2-4.jpg";
import Services25 from "@/assets/images/services/services-2-5.jpg";
import Services26 from "@/assets/images/services/services-2-6.jpg";

import ServiceDetailsImg1 from "@/assets/images/services/service-details-img-1.jpg";
import ServiceDetailsImg2 from "@/assets/images/services/service-details-img-2.jpg";
import ServiceDetailsImg3 from "@/assets/images/services/service-details-img-3.jpg";
import ServiceDetailsImg4 from "@/assets/images/services/service-details-img-4.jpg";
import ServiceDetailsImg5 from "@/assets/images/services/service-details-img-5.jpg";
import ServiceDetailsImg6 from "@/assets/images/services/service-details-img-6.jpg";

import ServiceDetailsImgBoxImg1 from "@/assets/images/services/service-details-img-box-img-1.jpg";
import ServiceDetailsImgBoxImg2 from "@/assets/images/services/service-details-img-box-img-2.jpg";

export const servicesData = [
    {
        id: 1,
        slug: "/banking",
        icon: "icon-financial",
        title: "Banking",
        text: "Account opening, AEPS withdrawal, deposit, money transfer, BC banking and more.",
        image: Services21,
        detailsImage: ServiceDetailsImg1,
        detailsTitle: "Banking Services",
        detailsText1:
            "At NISE COMPORT, we provide practical banking support for daily financial needs through Business Correspondent services. We help customers with account opening, Aadhaar based banking, money withdrawal, deposit support, fund transfer, and guidance for selected banking products in a simple and accessible way.",
        detailsText2:
            "NISE COMPORT works as a service support center and mediator for banking related requests. Availability of specific facilities may depend on partner bank rules, customer eligibility, server availability, and verification. Please verify transaction details carefully and always collect your receipt before leaving.",
        points: [
            "Bank of Baroda BC related support and basic customer service assistance",
            "AEPS cash withdrawal, balance enquiry and mini statement support",
            "Money transfer and assisted digital payment guidance",
            "Account opening support with document verification assistance",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Trusted Local Banking Help",
                text: "NISE COMPORT helps customers complete basic banking tasks with guided support, especially for users who prefer assisted service instead of self-service apps."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Receipt Based Process",
                text: "At NISE COMPORT, customers are advised to recheck details and collect transaction receipts immediately for safer service tracking and record keeping."
            }
        ],
        faq: [
            {
                question: "What banking services are available at NISE COMPORT?",
                answer: "NISE COMPORT helps with selected banking services such as account opening assistance, AEPS withdrawal, balance enquiry, mini statement support, money transfer guidance, and other BC related services depending on partner bank availability."
            },
            {
                question: "Can I withdraw money using Aadhaar at NISE COMPORT?",
                answer: "Yes, NISE COMPORT helps eligible customers withdraw money through AEPS using Aadhaar and biometric verification, subject to bank server, authentication success, and account linkage.",
                active: true
            },
            {
                question: "Do I need to carry documents for banking services?",
                answer: "Yes, NISE COMPORT may ask for Aadhaar, mobile number, bank details, or other required documents depending on the service. Please bring original or valid supporting documents for smooth processing."
            },
            {
                question: "Is receipt important after banking transaction?",
                answer: "Yes, NISE COMPORT always advises customers to verify the transaction and collect the receipt before leaving. It is important for proof, reconciliation, and future support in case of any issue."
            }
        ]
    },
    {
        id: 2,
        slug: "/government-services",
        icon: "icon-promotion-1",
        title: "Government",
        text: "Aadhaar update, PAN, Voter ID, certificates, transport and other assisted government services.",
        image: Services22,
        detailsImage: ServiceDetailsImg2,
        detailsTitle: "Government Services",
        detailsText1:
            "NISE COMPORT helps citizens access a wide range of assisted government services from one place. These may include PAN card applications, Voter ID related services, selected Aadhaar updates, residential certificate, income certificate, caste certificate, land related service support, and other public service form submissions.",
        detailsText2:
            "NISE COMPORT acts as a mediator and service support center. Final approval, correction, rejection, issuance time, and verification depend entirely on the respective government department. Customers must check every detail before submission because wrong entries may require reapplication or extra charges later.",
        points: [
            "Selected Aadhaar update support such as address, mobile number and relation name",
            "PAN card new application and correction support",
            "Voter ID new registration, correction and address update help",
            "Residential, income, caste and lagan related service assistance",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Single Window Support",
                text: "NISE COMPORT reduces confusion by helping customers understand which documents are needed and how the process works before applying."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Form Recheck Guidance",
                text: "NISE COMPORT encourages customers to verify spelling, number, address, and attached documents before final submission to avoid later correction issues."
            }
        ],
        faq: [
            {
                question: "What government services are commonly available at NISE COMPORT?",
                answer: "NISE COMPORT commonly helps with PAN card, Voter ID, selected Aadhaar updates, residential certificate, income certificate, caste certificate, lagan related support, and other department based digital applications."
            },
            {
                question: "Can Aadhaar be fully updated at NISE COMPORT?",
                answer: "No, NISE COMPORT currently supports only selected Aadhaar changes such as address, mobile number, and relation name update support as available through the active service process.",
                active: true
            },
            {
                question: "Will NISE COMPORT guarantee approval of my government form?",
                answer: "No, NISE COMPORT only helps in guided submission. Approval, rejection, verification, and issue date depend fully on the concerned government office or department."
            },
            {
                question: "Why should I verify the form before submission?",
                answer: "At NISE COMPORT, we always ask customers to review details carefully before submission because later correction may not be possible or may require additional processing charges and a fresh application."
            }
        ]
    },
    {
        id: 3,
        slug: "/insurance",
        icon: "icon-certified",
        title: "Insurance",
        text: "Bike, car, health, life, accidental and premium payment related insurance assistance.",
        image: Services23,
        detailsImage: ServiceDetailsImg3,
        detailsTitle: "Insurance Services",
        detailsText1:
            "NISE COMPORT helps customers explore and process multiple insurance related services including motor insurance, health insurance, life insurance, accidental coverage, renewal assistance, and premium payment support for selected providers and plans.",
        detailsText2:
            "Insurance availability, premium amount, claim process, policy issue, and renewal terms depend on the insurance company and the customer profile. NISE COMPORT acts as a service facilitator and guide, so customers should recheck nominee details, vehicle details, health declaration, and policy period before confirmation.",
        points: [
            "Bike, car, truck and commercial vehicle insurance support",
            "Health insurance and personal accident plan guidance",
            "Life insurance and selected LIC premium payment help",
            "Policy renewal support and document recheck assistance",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Multiple Insurance Assistance",
                text: "NISE COMPORT helps customers compare and process suitable insurance support in one place, reducing repeated visits and confusion."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Renewal Reminder Support",
                text: "NISE COMPORT can help customers with renewal related service guidance so policies stay active and documents remain aligned."
            }
        ],
        faq: [
            {
                question: "What insurance services does NISE COMPORT provide?",
                answer: "NISE COMPORT helps with selected motor, health, life, accidental insurance, premium support, policy renewals, and related service guidance depending on the insurer and active service availability."
            },
            {
                question: "Can I renew my bike or car insurance at NISE COMPORT?",
                answer: "Yes, NISE COMPORT helps customers with bike and car insurance renewal support. Please carry vehicle number, previous policy details, and owner information for proper processing.",
                active: true
            },
            {
                question: "Can I pay LIC premium through NISE COMPORT?",
                answer: "Yes, NISE COMPORT can assist with LIC premium payment support where available. Customers should keep the policy number and correct payment details ready before proceeding."
            },
            {
                question: "Who is responsible for final policy approval?",
                answer: "NISE COMPORT acts as a mediator and service support point. Final policy issuance, premium terms, and claim related decisions are handled by the concerned insurance company."
            }
        ]
    },
    {
        id: 4,
        slug: "/education",
        icon: "icon-ux-design",
        title: "Education",
        text: "E-learning, online course help, admission guidance, registration and education related support.",
        image: Services24,
        detailsImage: ServiceDetailsImg4,
        detailsTitle: "Education Services",
        detailsText1:
            "NISE COMPORT helps students and guardians with education related digital services such as online admissions, registration support, examination forms, scholarship related applications, e-learning access assistance, and selected course discovery or enrollment guidance.",
        detailsText2:
            "Requirements vary by institution, board, exam body, scholarship portal, and course provider. NISE COMPORT helps in form filling and document upload assistance, but final approval, seat allotment, eligibility, and payment acceptance depend on the respective school, college, university, or platform.",
        points: [
            "Online school, college and university form filling support",
            "Scholarship and exam related application assistance",
            "Course discovery and registration guidance where applicable",
            "Digital document upload, print and correction recheck support",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Student Friendly Help",
                text: "NISE COMPORT helps reduce mistakes in student applications by guiding users through form sections, required fields, and document checks."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Practical Form Support",
                text: "NISE COMPORT assists with photo, signature, file upload, payment step guidance, and final review before educational form submission."
            }
        ],
        faq: [
            {
                question: "What education related services are available at NISE COMPORT?",
                answer: "NISE COMPORT helps with admission forms, exam forms, scholarship support, selected online course registration help, and educational document upload assistance depending on the requirement."
            },
            {
                question: "Can NISE COMPORT fill school or college forms for me?",
                answer: "Yes, NISE COMPORT helps students fill school, college, university, scholarship, and exam related forms carefully so that common mistakes can be reduced.",
                active: true
            },
            {
                question: "Will NISE COMPORT guarantee admission or scholarship approval?",
                answer: "No, NISE COMPORT only provides submission help and guidance. Final admission, scholarship approval, verification, and selection are controlled by the concerned institution or department."
            },
            {
                question: "Should I verify my academic details before submission?",
                answer: "Yes, NISE COMPORT strongly advises students to check name, DOB, marks, category, mobile number, uploaded documents, and payment status before final submission."
            }
        ]
    },
    {
        id: 5,
        slug: "/fee-payment",
        icon: "icon-social-media-marketing",
        title: "Fee Payment",
        text: "School fees, college fees, tax payments, bill payments and assisted digital payment support.",
        image: Services25,
        detailsImage: ServiceDetailsImg5,
        detailsTitle: "Fee Payment Services",
        detailsText1:
            "NISE COMPORT helps customers complete multiple payment related tasks such as school fees, college fees, examination fees, selected tax fees, utility bill payments, recharge support, and other online payment requirements where manual assistance is useful.",
        detailsText2:
            "Customers should always verify the institution name, consumer number, student ID, bill amount, due date, and transaction summary before confirming payment. NISE COMPORT acts as a payment assistance center, and successful processing depends on the payment gateway, portal, or biller system.",
        points: [
            "School, college and examination fee payment support",
            "Selected tax, utility and bill payment assistance",
            "Recharge and digital payment support for eligible services",
            "Transaction summary and receipt collection guidance",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Easy Assisted Payment",
                text: "NISE COMPORT helps customers who are not comfortable with online portals by guiding them through the payment and confirmation process."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Receipt First Approach",
                text: "After every eligible payment, NISE COMPORT advises customers to collect and save receipts immediately for future proof and reconciliation."
            }
        ],
        faq: [
            {
                question: "What payments can be made at NISE COMPORT?",
                answer: "NISE COMPORT helps with selected fee payments such as school fee, college fee, exam fee, utility bills, tax related payments, recharges, and other assisted digital transaction needs."
            },
            {
                question: "Can I pay school or college fees at NISE COMPORT?",
                answer: "Yes, NISE COMPORT assists with school and college fee payments where the institution portal or payment mode is supported. Please bring correct student details before payment.",
                active: true
            },
            {
                question: "Why is receipt important after fee payment?",
                answer: "NISE COMPORT always advises customers to collect and keep the payment receipt because it is required in case of pending update, dispute, or institution side confirmation delay."
            },
            {
                question: "Can payment mistakes be corrected later?",
                answer: "Not always. At NISE COMPORT, customers are requested to recheck amount, account, bill number, and identity details before payment because reversal or correction may not be possible in every case."
            }
        ]
    },
    {
        id: 6,
        slug: "/form-filing",
        icon: "icon-code",
        title: "Form Filing",
        text: "ITR, GST, school forms, college forms, registrations and assisted online form services.",
        image: Services26,
        detailsImage: ServiceDetailsImg6,
        detailsTitle: "Form Filing Services",
        detailsText1:
            "NISE COMPORT provides assisted form filling for individuals, students, workers, and small business users. This may include ITR filing support, GST related basic assistance, school and college forms, job applications, registrations, scholarship forms, and other official or private portal based submissions.",
        detailsText2:
            "Form acceptance depends on the concerned portal or authority. NISE COMPORT acts only as a mediator and service assistant, so customers must verify personal data, uploaded files, and application details before final submission. Reissue, correction, or refiling charges may apply later if wrong information is provided.",
        points: [
            "ITR filing and selected GST related support",
            "Government, private, school and college form filling assistance",
            "Job, exam, scholarship and registration based submission help",
            "Document upload, payment guidance and receipt confirmation support",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Reduced Form Errors",
                text: "NISE COMPORT helps customers avoid common mistakes by checking mandatory fields, documents, and submission steps before final action."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Simple Guided Submission",
                text: "NISE COMPORT makes complex online forms easier for customers who need support with upload, format, payment, or portal navigation."
            }
        ],
        faq: [
            {
                question: "What kind of forms does NISE COMPORT fill?",
                answer: "NISE COMPORT helps fill ITR, GST related forms, school forms, college forms, scholarship forms, job forms, examination forms, and many other online applications depending on the requirement."
            },
            {
                question: "Can NISE COMPORT file ITR for individuals?",
                answer: "Yes, NISE COMPORT provides basic ITR filing support for eligible individuals based on available documents and income details. Customers should carry PAN, Aadhaar, and required financial information.",
                active: true
            },
            {
                question: "Can wrong information be corrected after form submission?",
                answer: "Not in every case. NISE COMPORT clearly advises customers to verify all details before submission because corrections later may be restricted, delayed, or chargeable."
            },
            {
                question: "Is NISE COMPORT responsible for final acceptance of the form?",
                answer: "No, NISE COMPORT works as a mediator and service assistant. Final acceptance, verification, and processing are handled by the respective portal, institution, or department."
            }
        ]
    },
    {
        id: 7,
        slug: "/it-sales-service",
        icon: "icon-software-development",
        title: "IT Sales & Service",
        text: "Laptop, desktop, printer, accessories and basic IT sales or service related support.",
        image: Services21,
        detailsImage: ServiceDetailsImg1,
        detailsTitle: "IT Sales & Service",
        detailsText1:
            "NISE COMPORT also supports basic IT product and service requirements such as laptop and desktop assistance, selected peripheral support, printer related guidance, accessory availability, and practical help for users who need local digital support.",
        detailsText2:
            "Product availability, warranty, price, repair timeline, and service scope may vary by brand, supplier, and issue type. NISE COMPORT helps customers understand the available options and service process before proceeding.",
        points: [
            "Laptop and desktop sales support guidance",
            "Basic peripheral and accessory related assistance",
            "Printer and selected device service coordination support",
            "Useful local digital support for home, study and office needs",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Practical Device Help",
                text: "NISE COMPORT supports customers who need everyday digital tools and local assistance for common IT usage needs."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Simple Guidance",
                text: "NISE COMPORT explains product or service options in a simple way so customers can choose what fits their need and budget."
            }
        ],
        faq: [
            {
                question: "What IT products or services are available at NISE COMPORT?",
                answer: "NISE COMPORT helps with selected laptop, desktop, printer, peripheral, and basic IT sales or service related support depending on availability and requirement."
            },
            {
                question: "Can I get laptop or desktop support from NISE COMPORT?",
                answer: "Yes, NISE COMPORT provides local guidance and assistance for selected laptop or desktop related needs, including sales support and some service coordination.",
                active: true
            },
            {
                question: "Are all devices repaired directly at NISE COMPORT?",
                answer: "Not always. NISE COMPORT may provide direct guidance, basic support, or coordination depending on the device issue, part availability, and service type."
            },
            {
                question: "Should I confirm price and scope before service?",
                answer: "Yes, NISE COMPORT advises customers to confirm model, issue, estimated service scope, and charges before proceeding with any IT related support."
            }
        ]
    },
    {
        id: 8,
        slug: "/travel",
        icon: "icon-insurance",
        title: "Travel",
        text: "Flight, train, bus, hotel booking and practical travel service assistance.",
        image: Services22,
        detailsImage: ServiceDetailsImg2,
        detailsTitle: "Travel Services",
        detailsText1:
            "NISE COMPORT helps customers with common travel related bookings such as train tickets, flight tickets, bus tickets, hotel booking support, and related travel assistance where digital booking help is needed.",
        detailsText2:
            "Ticket availability, fare changes, cancellation rules, boarding policy, reschedule terms, and refund processing depend on the respective travel provider or booking platform. NISE COMPORT acts as a booking assistance center, so customers should verify name, age, date, route, and mobile number before final confirmation.",
        points: [
            "Train booking and selected travel assistance support",
            "Domestic and international flight booking guidance",
            "Bus and hotel booking help depending on platform availability",
            "Cancellation, recheck and receipt confirmation support",
        ],
        benefits: [
            {
                image: ServiceDetailsImgBoxImg1,
                icon: "icon-financial",
                title: "Easy Assisted Booking",
                text: "NISE COMPORT helps customers who are not comfortable booking travel online by guiding them through the booking process."
            },
            {
                image: ServiceDetailsImgBoxImg2,
                icon: "icon-certified",
                title: "Booking Detail Recheck",
                text: "NISE COMPORT encourages customers to verify passenger names, journey dates, route, and contact details carefully before final payment."
            }
        ],
        faq: [
            {
                question: "What travel bookings are available at NISE COMPORT?",
                answer: "NISE COMPORT helps with selected train, flight, bus, and hotel booking support based on availability and travel platform rules."
            },
            {
                question: "Can NISE COMPORT book train and flight tickets?",
                answer: "Yes, NISE COMPORT helps customers with train and flight booking assistance. Please confirm traveller name, age, date, and route properly before ticket generation.",
                active: true
            },
            {
                question: "Can booked tickets be cancelled or changed later?",
                answer: "This depends on the provider rules. NISE COMPORT can help guide the cancellation or modification process where available, but refund and rule decisions depend on the booking platform or operator."
            },
            {
                question: "Why should I verify booking details before payment?",
                answer: "At NISE COMPORT, we always advise customers to recheck passenger details, travel date, route, and mobile number because incorrect travel entries may lead to extra charges or booking issues later."
            }
        ]
    }
];