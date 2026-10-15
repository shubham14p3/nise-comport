import type { Metadata } from "next";
import {pageMetadata} from "@/lib/seo";
import PrintOrderForm from "@/components/print-order-form";
export const metadata:Metadata=pageMetadata('Online Printing & Scanning in Jamshedpur','Upload a PDF, Word file or photo, choose pages and copies, and request pickup or delivery from NISE COMPORT, Kharangajhar, Telco. No online payment needed.','/print');
export default function PrintPage(){return <PrintOrderForm/>}
