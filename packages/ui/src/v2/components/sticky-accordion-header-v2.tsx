import { type ParentProps } from "solid-js"
import { AccordionV2, type AccordionV2HeaderProps } from "./accordion-v2"
import "./sticky-accordion-header-v2.css"

export function StickyAccordionHeaderV2(props: ParentProps<AccordionV2HeaderProps>) {
  return (
    <AccordionV2.Header
      {...props}
      data-component="sticky-accordion-header-v2"
      classList={{
        ...props.classList,
        [props.class ?? ""]: !!props.class,
      }}
    >
      {props.children}
    </AccordionV2.Header>
  )
}
