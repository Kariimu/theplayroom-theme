import { hookRegistry, HookName, type HookContext } from '@salla.sa/twilight-theme-engine/hooks';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { AddProductToast } from '../components/cart';
import { DigitalFilesSettings } from '../components/product';
import { FloatingWhatsApp } from '../components/layout/FloatingWhatsApp';

export function registerThemeHooks() {
  // Register AddProductToast at body:end hook slot. Default on (twilight.json
  // ships the setting `"value": true`); only an explicit `false` turns it off.
  hookRegistry.register(
    HookName.BODY_END,
    (context: HookContext) => {
      const { twilight } = context;
      if (twilight?.theme?.settings?.enable_add_product_toast === false) return null;
      return <AddProductToast />;
    },
    50
  );

  // Floating WhatsApp button after the footer, when `show_whatsapp` is on
  // (old theme's `.wa-float-btn`). Number from the `whatsapp_number` setting.
  hookRegistry.register(
    HookName.BODY_END,
    (context: HookContext) => {
      const settings = context.twilight?.theme?.settings as
        | { show_whatsapp?: boolean; whatsapp_number?: string | number }
        | undefined;
      if (!settings?.show_whatsapp) return null;
      return <FloatingWhatsApp number={settings.whatsapp_number} />;
    },
    40
  );

  // Register DigitalFilesSettings at product:single.description hook slot
  // Receives product from ProductDetails via context prop
  hookRegistry.register(
    HookName.PRODUCT_DESCRIPTION,
    (context: HookContext) => {
      const { product } = context as { product?: Product };
      if (!product?.digital_files_settings) return null;
      return <DigitalFilesSettings {...product.digital_files_settings} />;
    },
    50
  );
}
