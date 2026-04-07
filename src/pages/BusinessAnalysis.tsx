import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ServiceDetails = lazy(
    () => import("@/features/service-details/ServicesDetails"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function BusinessAnalysis() {
    return (
        <>
            <SEO title="Fee Payment NISE COMPORT || NISE COMPORT PRAGYA KENDRA || CSC CENTER JAMSHEDPUR || PRAGYA KENDRA JAMSHEDPUR || CSC SERVICES JHARKHAND || PAN || PAN CARD || PAN CARD APPLY || PAN CARD CORRECTION || NEW PAN CARD || PAN UPDATE || PAN LINK AADHAAR || PERMANENT ACCOUNT NUMBER || AADHAAR || AADHAAR CARD || AADHAAR UPDATE || AADHAAR MOBILE UPDATE || AADHAAR ADDRESS CHANGE || UIDAI UPDATE || AADHAR CORRECTION || आधार कार्ड || आधार अपडेट || आधार सुधार || मोबाइल नंबर अपडेट  || VOTER ID || VOTER CARD || NEW VOTER ID || VOTER CORRECTION || VOTER ADDRESS CHANGE || ELECTION CARD APPLY || वोटर कार्ड || वोटर आईडी || वोटर सुधार || PASSPORT APPLY || PASSPORT FORM || PASSPORT CORRECTION || PASSPORT ONLINE || DRIVING LICENSE || DL APPLY || DL RENEWAL || DRIVING LICENSE CORRECTION || DRIVING LICENSE RENEW || RESIDENTIAL CERTIFICATE || DOMICILE CERTIFICATE || INCOME CERTIFICATE || CASTE CERTIFICATE || EWS CERTIFICATE || LOCAL CERTIFICATE || RESIDENTIAL APPLY || INCOME APPLY || CASTE APPLY || निवास प्रमाण पत्र || आय प्रमाण पत्र || जाति प्रमाण पत्र || EWS प्रमाण पत्र || RENT AGREEMENT || AGREEMENT || ONLINE RENT AGREEMENT || NOC CERTIFICATE || AFFIDAVIT || LIC PREMIUM PAYMENT || LIC SERVICE || INSURANCE PAYMENT || LIFE INSURANCE || MOTOR INSURANCE || BIKE INSURANCE || CAR INSURANCE || VEHICLE INSURANCE || MOTOR POLICY RENEWAL || SIP INVESTMENT || MUTUAL FUND SIP || INVESTMENT PLAN || BANKING SERVICES || BANK OF BARODA BC || CSP BANKING || AEPS || AADHAAR WITHDRAWAL || MONEY TRANSFER || CASH DEPOSIT || BALANCE CHECK || CSC SERVICES || DIGITAL SERVICES INDIA || ONLINE FORM FILLING || GOVERNMENT FORM APPLY || JOB FORM || SCHOLARSHIP FORM || EXAM FORM || IRCTC TICKET BOOKING || TRAIN TICKET || FLIGHT BOOKING || BUS TICKET || MOBILE RECHARGE || ELECTRICITY BILL PAYMENT || GAS BILL PAYMENT || UTILITY BILL PAYMENTPRINTING || SCANNING || PHOTOCOPY || ONLINE SERVICES CENTER || NISE COMPORT JAMSHEDPUR || KHARANGAJHAR TELCO CSC || SINGH BUILDING CSC CENTER || NISE COMPORT || NISE COMPORT || NISE COMPORT SERVICES || BEST CSC CENTER JAMSHEDPUR || BEST PRAGYA KENDRA NEAR ME || PAN PAN PAN || PAN CARD PAN CARD || AADHAAR AADHAAR AADHAAR || VOTER VOTER VOTER || CSC CSC CSC || आधार कार्ड सेवा || पैन कार्ड सेवा || वोटर कार्ड सेवा || सरकारी सेवा केंद्र || प्रज्ञा केंद्र || ONLINE SERVICE CENTER JAMSHEDPUR || DIGITAL SEVA CENTER || CSC NEAR ME || PRAGYA KENDRA NEAR ME || GOVERNMENT SERVICES JAMSHEDPUR || CSC CENTER TELCO JAMSHEDPUR || DIGITAL SERVICES CENTER INDIA || JAMSHEDPUR || Jharkhand || Pragya Kendra || pragya || Kendra || Digitalseva|| csc || CSC || Csc || UTI || NSDL" />
            <PageHeader
                title="Fee Payment"
                subtitle="Fee Payment"
            />
            <SuspenseWrapper>
                <ErrorBoundary name="fee-payment Page">
                    <ServiceDetails />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
