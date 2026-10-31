import type { Metadata } from "next";
import {pageMetadata} from "@/lib/seo";
import PrintOrderForm from "@/components/print-order-form";
import PrintPriceEnquiry from "@/components/print-price-enquiry";
import { FEATURES } from "@/lib/features";
export const metadata:Metadata=pageMetadata('Online Printing & Scanning in Jamshedpur',FEATURES.printUploads ? 'Upload a PDF, Word file or photo, choose pages and copies, and request pickup or delivery from NiSE COMPORT, Kharangajhar, Telco. No online payment needed.' : 'Ask NiSE COMPORT, Kharangajhar, Telco for the price of printing, scanning and photocopy. Send your requirement and we reply with the charge.','/print');
export default function PrintPage(){return FEATURES.printUploads ? <PrintOrderForm/> : <PrintPriceEnquiry/>}
