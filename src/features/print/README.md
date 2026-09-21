# NISE Print Service

This is the first reusable transactional service module for NISE COMPORT.

The flow is: discover -> configure/upload -> authenticate -> page/settings selection -> server-authoritative pricing -> wallet/coupon -> pickup/delivery -> payment -> staff print job -> status -> completion -> wallet reward.

The browser must never be authoritative for pricing, wallet balances, payment state, file authorization or order status.

The initial foundation supports PDF, Word, JPG/JPEG and PNG configuration, page selections such as 1-5,8,10-14, flat or progressive pricing tiers, fulfilment types and the print order status model.
