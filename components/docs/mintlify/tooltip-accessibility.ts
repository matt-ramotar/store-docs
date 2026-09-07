"use client";

export interface TooltipAccessibilityTarget {
  descriptionId: string;
  popup: Element | null | undefined;
  trigger: Element;
}

type TooltipAccessibilityResolver = () => TooltipAccessibilityTarget[];

interface LinkedTooltip {
  descriptionId: string;
  popup: Element;
  popupId: string | null;
  popupRole: string | null;
}

/** Links body-mounted Mintlify tooltip popups to their triggers for the popup lifetime. */
export function observeTooltipAccessibility(resolveTargets: TooltipAccessibilityResolver) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !document.body) {
    return () => {};
  }

  let linked = new Map<Element, LinkedTooltip>();
  const unlink = (trigger: Element, link: LinkedTooltip) => {
    const ids = (trigger.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((value) => value && value !== link.descriptionId);
    if (ids.length) trigger.setAttribute("aria-describedby", ids.join(" "));
    else trigger.removeAttribute("aria-describedby");
    if (link.popupId === null) link.popup.removeAttribute("id");
    else link.popup.setAttribute("id", link.popupId);
    if (link.popupRole === null) link.popup.removeAttribute("role");
    else link.popup.setAttribute("role", link.popupRole);
  };
  const sync = () => {
    const next = new Map<Element, LinkedTooltip>();
    for (const { descriptionId, popup, trigger } of resolveTargets()) {
      if (!popup || !trigger.hasAttribute("data-popup-open")) continue;
      const prior = linked.get(trigger);
      const link = prior?.popup === popup && prior.descriptionId === descriptionId
        ? prior
        : {
            descriptionId,
            popup,
            popupId: popup.getAttribute("id"),
            popupRole: popup.getAttribute("role"),
          };
      next.set(trigger, link);
    }
    for (const [trigger, prior] of linked) {
      const current = next.get(trigger);
      if (!current || current.popup !== prior.popup || current.descriptionId !== prior.descriptionId) {
        unlink(trigger, prior);
      }
    }
    for (const [trigger, link] of next) {
      const { descriptionId, popup } = link;
      popup.setAttribute("id", descriptionId);
      popup.setAttribute("role", "tooltip");
      const ids = new Set((trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
      ids.add(descriptionId);
      trigger.setAttribute("aria-describedby", [...ids].join(" "));
    }
    linked = next;
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-popup-open"],
  });
  sync();
  return () => {
    observer.disconnect();
    for (const [trigger, link] of linked) unlink(trigger, link);
    linked.clear();
  };
}

function normalizeColor(value: string) {
  const probe = document.createElement("span");
  probe.style.color = value;
  return probe.style.color.replace(/\s+/g, "").toLowerCase();
}

/** Adapts the Tooltip instances created privately by Mintlify Color.Item. */
export function observeNativeColorTooltips(scopeClass: string, descriptionIdPrefix: string) {
  return observeTooltipAccessibility(() => {
    const scope = document.getElementsByClassName(scopeClass)[0];
    if (!scope) return [];
    const triggers = Array.from(scope.querySelectorAll('[data-component-part="color-item-button"]'));
    const popups = Array.from(document.querySelectorAll('[data-component-part="tooltip-content"]'));
    const claimed = new Set<Element>();
    return triggers.map((trigger, index) => {
      if (!trigger.hasAttribute("data-popup-open")) {
        return { descriptionId: `${descriptionIdPrefix}-${index + 1}`, popup: null, trigger };
      }
      const triggerColor = normalizeColor((trigger as HTMLElement).style.backgroundColor);
      const popup = popups.find((candidate) => {
        if (claimed.has(candidate)) return false;
        const title = candidate.querySelector('[data-component-part="tooltip-title"]')?.textContent ?? "";
        return normalizeColor(title) === triggerColor;
      });
      if (popup) claimed.add(popup);
      return {
        descriptionId: `${descriptionIdPrefix}-${index + 1}`,
        popup,
        trigger,
      };
    });
  });
}
