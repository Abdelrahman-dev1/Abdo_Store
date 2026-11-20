export type PromoRewardType =
  | 'free_shipping'
  | 'shipping_discount_percent'
  | 'fixed_discount'
  | 'percent_discount'
  | 'custom_gift';

export type PromoConditionType =
  | 'min_order_amount'
  | 'completed_orders_cycle'
  | 'days_of_week'
  | 'time_window'
  | 'first_order'
  | 'specific_city'
  | 'min_items_count'
  | 'custom_manual';

export type PromoRule = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  display_order: number;
  is_stackable: boolean;
  reward_type: PromoRewardType;
  reward_value: number | null;
  custom_reward_label: string | null;
  condition_type: PromoConditionType;
  custom_condition_label: string | null;
  condition_config: Record<string, unknown>;
  customer_message: string | null;
  admin_alert_text: string | null;
};

export type OrderEvaluationContext = {
  subtotal: number;
  itemsCount: number;
  city?: string;
  completedOrdersCount?: number;
  orderDate?: Date;
};

export type EvaluatedRuleResult = {
  rule: PromoRule;
  matched: boolean;
  rewardLabel: string;
  conditionLabel: string;
  progressPercent?: number;
  remainingHint?: string;
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<string, string> = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
};

export function getRewardLabel(rule: PromoRule): string {
  switch (rule.reward_type) {
    case 'free_shipping':
      return 'شحن مجاني 100%';
    case 'shipping_discount_percent':
      return `خصم ${rule.reward_value ?? 50}% على الشحن`;
    case 'fixed_discount':
      return `خصم ${rule.reward_value ?? 0} ج`;
    case 'percent_discount':
      return `خصم ${rule.reward_value ?? 0}%`;
    case 'custom_gift':
      return rule.custom_reward_label || 'هدية خاصة';
  }
}

export function getConditionLabel(rule: PromoRule): string {
  const cfg = rule.condition_config || {};
  switch (rule.condition_type) {
    case 'min_order_amount':
      return `فاتورة ${cfg.min_amount ?? 1000} ج أو أكثر`;
    case 'completed_orders_cycle':
      return `بعد ${cfg.required_completed ?? 5} طلبات مكتملة (الطلب رقم ${cfg.free_on_order_number ?? 6
        })`;
    case 'days_of_week': {
      const days = Array.isArray(cfg.days) ? (cfg.days as string[]) : [];
      const names = days.map((d) => DAY_LABELS[d] || d).join('، ');
      return `أيام: ${names || 'محددة'}`;
    }
    case 'time_window':
      return `من ${cfg.start_hour ?? '00:00'} إلى ${cfg.end_hour ?? '05:00'}`;
    case 'first_order':
      return 'أول أوردر لعميل جديد';
    case 'specific_city': {
      const cities = Array.isArray(cfg.cities)
        ? (cfg.cities as string[]).join('، ')
        : '';
      return `مدن: ${cities || 'محددة'}`;
    }
    case 'min_items_count':
      return `عدد قطع ${cfg.min_items ?? 3} أو أكثر`;
    case 'custom_manual':
      return rule.custom_condition_label || String(cfg.note || 'عرض خاص');
  }
}

function isTimeInWindow(now: Date, startStr: string, endStr: string): boolean {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins <= endMins;
  }
  return currentMins >= startMins || currentMins <= endMins;
}

export function evaluatePromoRules(
  rules: PromoRule[],
  ctx: OrderEvaluationContext,
): {
  matchedRules: EvaluatedRuleResult[];
  upcomingHints: EvaluatedRuleResult[];
  allEvaluated: EvaluatedRuleResult[];
} {
  const activeRules = [...rules]
    .filter((r) => r.is_active)
    .sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));

  const now = ctx.orderDate ?? null;
    const evaluated: EvaluatedRuleResult[] = [];

  for (const rule of activeRules) {
    const cfg = rule.condition_config || {};
    let matched = false;
    let progressPercent: number | undefined;
    let remainingHint: string | undefined;

    switch (rule.condition_type) {
      case 'min_order_amount': {
        const minAmount = Math.max(1, Number(cfg.min_amount ?? 1000));
        matched = ctx.subtotal >= minAmount;
        progressPercent = Math.min(
          100,
          Math.round((ctx.subtotal / minAmount) * 100),
        );
        if (!matched) {
          const diff = Math.max(0, minAmount - ctx.subtotal);
          remainingHint = `فاضلك ${diff} ج بس وتاخد ${getRewardLabel(rule)}`;
        }
        break;
      }

      case 'completed_orders_cycle': {
        const req = Math.max(1, Number(cfg.required_completed ?? 5));
        const cycleLen = Math.max(
          req + 1,
          Number(cfg.free_on_order_number ?? req + 1),
        );
        if (typeof ctx.completedOrdersCount === 'number') {
          const posInCycle = ctx.completedOrdersCount % cycleLen;
          matched = posInCycle === req;
          progressPercent = Math.min(100, Math.round((posInCycle / req) * 100));
          if (!matched) {
            const left = req - posInCycle;
            remainingHint = `فاضلك ${left} طلب مكتمل وتاخد ${getRewardLabel(rule)}`;
          }
        }
        break;
      }

      case 'days_of_week': {
        if (now) {
          const days = Array.isArray(cfg.days) ? (cfg.days as string[]) : [];
          const todayKey = DAY_KEYS[now.getDay()];
          matched = days.includes(todayKey);
        }
        break;
      }

      case 'time_window': {
        if (now) {
          matched = isTimeInWindow(
            now,
            String(cfg.start_hour ?? '00:00'),
            String(cfg.end_hour ?? '05:00'),
          );
        }
        break;
      }

      case 'first_order': {
        if (typeof ctx.completedOrdersCount === 'number') {
          matched = ctx.completedOrdersCount === 0;
        }
        break;
      }

      case 'specific_city': {
        const cities = Array.isArray(cfg.cities)
          ? (cfg.cities as string[]).map((c) => c.trim().toLowerCase())
          : [];
        const target = (ctx.city || '').trim().toLowerCase();
        matched = Boolean(target && cities.some((c) => target.includes(c)));
        break;
      }

      case 'min_items_count': {
        const minItems = Math.max(1, Number(cfg.min_items ?? 3));
        matched = ctx.itemsCount >= minItems;
        progressPercent = Math.min(
          100,
          Math.round((ctx.itemsCount / minItems) * 100),
        );
        if (!matched) {
          const diff = Math.max(0, minItems - ctx.itemsCount);
          remainingHint = `زوّد ${diff} قطعة بس وتاخد ${getRewardLabel(rule)}`;
        }
        break;
      }

      case 'custom_manual': {
        matched = false;
        break;
      }
    }

    evaluated.push({
      rule,
      matched,
      rewardLabel: getRewardLabel(rule),
      conditionLabel: getConditionLabel(rule),
      progressPercent,
      remainingHint,
    });
  }

  // تطبيق منطق Stackable vs Single حسب الأولوية
  const finalMatched: EvaluatedRuleResult[] = [];
  for (const item of evaluated.filter((e) => e.matched)) {
    if (finalMatched.length === 0) {
      finalMatched.push(item);
      if (!item.rule.is_stackable) break;
    } else if (item.rule.is_stackable) {
      finalMatched.push(item);
    }
  }

  // ترتيب الظهور للعميل حسب display_order
  finalMatched.sort(
    (a, b) => (a.rule.display_order ?? 1) - (b.rule.display_order ?? 1),
  );

  const upcomingHints = evaluated
    .filter((e) => !e.matched && Boolean(e.remainingHint))
    .sort((a, b) => (a.rule.display_order ?? 1) - (b.rule.display_order ?? 1));

  return {
    matchedRules: finalMatched,
    upcomingHints,
    allEvaluated: evaluated.sort(
      (a, b) => (a.rule.display_order ?? 1) - (b.rule.display_order ?? 1),
    ),
  };
}
