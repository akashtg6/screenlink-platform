
declare module '@/components/ui/alert-dialog' {
  import * as React from 'react'
  export interface AlertDialogProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }
  export const AlertDialog: React.FC<AlertDialogProps>
  export const AlertDialogTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const AlertDialogPortal: React.FC<{ children?: React.ReactNode; container?: HTMLElement }>
  export const AlertDialogOverlay: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const AlertDialogContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const AlertDialogTitle: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >
  export const AlertDialogDescription: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >
  export const AlertDialogAction: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
  >
  export const AlertDialogCancel: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
  >
}

/**
 * Ambient type declarations for the shadcn/ui components that ship as .jsx.
 *
 * These files are copied verbatim from `shadcn add …` (pre-TS conversion), so
 * TypeScript can't infer prop types. Rather than convert every file to .tsx —
 * which introduces churn — we declare permissive but usable interfaces here.
 *
 * The declarations use `React.ComponentProps<'div' | 'button' | …>` extended
 * with the extra variant/state props the shadcn primitives accept. This gives
 * IntelliSense in the editor and unblocks strict-TS compilation.
 */
declare module '@/components/ui/button' {
  import * as React from 'react'
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
  }
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>
  export const buttonVariants: (opts?: { variant?: ButtonProps['variant']; size?: ButtonProps['size']; className?: string }) => string
}

declare module '@/components/ui/input' {
  import * as React from 'react'
  export type InputProps = React.InputHTMLAttributes<HTMLInputElement>
  export const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>
}

declare module '@/components/ui/textarea' {
  import * as React from 'react'
  export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
  export const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>
}

declare module '@/components/ui/label' {
  import * as React from 'react'
  export const Label: React.ForwardRefExoticComponent<
    React.LabelHTMLAttributes<HTMLLabelElement> & React.RefAttributes<HTMLLabelElement>
  >
}

declare module '@/components/ui/checkbox' {
  import * as React from 'react'
  export interface CheckboxProps extends React.HTMLAttributes<HTMLButtonElement> {
    checked?: boolean | 'indeterminate'
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    required?: boolean
    name?: string
    value?: string
  }
  export const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>
}

declare module '@/components/ui/switch' {
  import * as React from 'react'
  export interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    name?: string
    value?: string
  }
  export const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>
}

declare module '@/components/ui/radio-group' {
  import * as React from 'react'
  export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    name?: string
  }
  export interface RadioGroupItemProps extends React.HTMLAttributes<HTMLButtonElement> {
    value: string
    disabled?: boolean
    required?: boolean
  }
  export const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>
  export const RadioGroupItem: React.ForwardRefExoticComponent<RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>>
}

declare module '@/components/ui/select' {
  import * as React from 'react'
  export interface SelectProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
    disabled?: boolean
    name?: string
    children?: React.ReactNode
  }
  export const Select: React.FC<SelectProps>
  export const SelectGroup: React.FC<{ children?: React.ReactNode }>
  export const SelectValue: React.FC<{ placeholder?: React.ReactNode; children?: React.ReactNode }>
  export const SelectTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
  >
  export const SelectContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { position?: 'item-aligned' | 'popper' } & React.RefAttributes<HTMLDivElement>
  >
  export const SelectLabel: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const SelectItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean } & React.RefAttributes<HTMLDivElement>
  >
  export const SelectSeparator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const SelectScrollUpButton: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const SelectScrollDownButton: React.FC<React.HTMLAttributes<HTMLDivElement>>
}

declare module '@/components/ui/card' {
  import * as React from 'react'
  type DivRef = React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const Card: DivRef
  export const CardHeader: DivRef
  export const CardTitle: DivRef
  export const CardDescription: DivRef
  export const CardContent: DivRef
  export const CardFooter: DivRef
}

declare module '@/components/ui/badge' {
  import * as React from 'react'
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  export const Badge: React.FC<BadgeProps>
  export const badgeVariants: (opts?: { variant?: BadgeProps['variant']; className?: string }) => string
}

declare module '@/components/ui/alert' {
  import * as React from 'react'
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive'
  }
  export const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>
  export const AlertTitle: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >
  export const AlertDescription: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >
}

declare module '@/components/ui/progress' {
  import * as React from 'react'
  export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number | null
    max?: number
  }
  export const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>
}

declare module '@/components/ui/separator' {
  import * as React from 'react'
  export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
  }
  export const Separator: React.ForwardRefExoticComponent<SeparatorProps & React.RefAttributes<HTMLDivElement>>
}

declare module '@/components/ui/skeleton' {
  import * as React from 'react'
  export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>>
}

declare module '@/components/ui/accordion' {
  import * as React from 'react'
  export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
    type: 'single' | 'multiple'
    value?: string | string[]
    defaultValue?: string | string[]
    onValueChange?: (v: string | string[]) => void
    collapsible?: boolean
  }
  export const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>
  export const AccordionItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean } & React.RefAttributes<HTMLDivElement>
  >
  export const AccordionTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
  >
  export const AccordionContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
}

declare module '@/components/ui/tabs' {
  import * as React from 'react'
  export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    orientation?: 'horizontal' | 'vertical'
  }
  export const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>
  export const TabsList: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const TabsTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLButtonElement> & { value: string; disabled?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const TabsContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { value: string } & React.RefAttributes<HTMLDivElement>
  >
}

declare module '@/components/ui/table' {
  import * as React from 'react'
  export const Table: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableElement> & React.RefAttributes<HTMLTableElement>
  >
  export const TableHeader: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >
  export const TableBody: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >
  export const TableFooter: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >
  export const TableRow: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableRowElement> & React.RefAttributes<HTMLTableRowElement>
  >
  export const TableHead: React.ForwardRefExoticComponent<
    React.ThHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>
  >
  export const TableCell: React.ForwardRefExoticComponent<
    React.TdHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>
  >
  export const TableCaption: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableCaptionElement> & React.RefAttributes<HTMLTableCaptionElement>
  >
}

declare module '@/components/ui/dialog' {
  import * as React from 'react'
  export interface DialogProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    modal?: boolean
    children?: React.ReactNode
  }
  export const Dialog: React.FC<DialogProps>
  export const DialogTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const DialogPortal: React.FC<{ children?: React.ReactNode; container?: HTMLElement }>
  export const DialogOverlay: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const DialogContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogTitle: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >
  export const DialogDescription: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >
  export const DialogClose: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
}

declare module '@/components/ui/popover' {
  import * as React from 'react'
  export interface PopoverProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    modal?: boolean
    children?: React.ReactNode
  }
  export const Popover: React.FC<PopoverProps>
  export const PopoverTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const PopoverContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      align?: 'start' | 'center' | 'end'
      side?: 'top' | 'right' | 'bottom' | 'left'
      sideOffset?: number
    } & React.RefAttributes<HTMLDivElement>
  >
  export const PopoverAnchor: React.FC<{ children?: React.ReactNode }>
}

declare module '@/components/ui/dropdown-menu' {
  import * as React from 'react'
  export interface DropdownMenuProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    modal?: boolean
    dir?: 'ltr' | 'rtl'
    children?: React.ReactNode
  }
  export const DropdownMenu: React.FC<DropdownMenuProps>
  export const DropdownMenuTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const DropdownMenuContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end'; sideOffset?: number } & React.RefAttributes<HTMLDivElement>
  >
  type ItemProps = React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; disabled?: boolean; asChild?: boolean; onSelect?: (e: Event) => void }
  export const DropdownMenuItem: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLDivElement>>
  export const DropdownMenuCheckboxItem: React.ForwardRefExoticComponent<
    ItemProps & { checked?: boolean; onCheckedChange?: (v: boolean) => void } & React.RefAttributes<HTMLDivElement>
  >
  export const DropdownMenuRadioGroup: React.FC<{ value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode }>
  export const DropdownMenuRadioItem: React.ForwardRefExoticComponent<
    ItemProps & { value: string } & React.RefAttributes<HTMLDivElement>
  >
  export const DropdownMenuLabel: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean } & React.RefAttributes<HTMLDivElement>
  >
  export const DropdownMenuSeparator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const DropdownMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>>
  export const DropdownMenuGroup: React.FC<{ children?: React.ReactNode }>
  export const DropdownMenuPortal: React.FC<{ children?: React.ReactNode; container?: HTMLElement }>
  export const DropdownMenuSub: React.FC<{ children?: React.ReactNode }>
  export const DropdownMenuSubContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
  export const DropdownMenuSubTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean } & React.RefAttributes<HTMLDivElement>
  >
}

declare module '@/components/ui/tooltip' {
  import * as React from 'react'
  export const TooltipProvider: React.FC<{ children?: React.ReactNode; delayDuration?: number; skipDelayDuration?: number }>
  export interface TooltipProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode; delayDuration?: number }
  export const Tooltip: React.FC<TooltipProps>
  export const TooltipTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const TooltipContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; side?: 'top' | 'right' | 'bottom' | 'left' } & React.RefAttributes<HTMLDivElement>
  >
}

declare module '@/components/ui/breadcrumb' {
  import * as React from 'react'
  export const Breadcrumb: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLElement> & { separator?: React.ReactNode } & React.RefAttributes<HTMLElement>
  >
  export const BreadcrumbList: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLOListElement> & React.RefAttributes<HTMLOListElement>
  >
  export const BreadcrumbItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLLIElement> & React.RefAttributes<HTMLLIElement>
  >
  export const BreadcrumbLink: React.ForwardRefExoticComponent<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean } & React.RefAttributes<HTMLAnchorElement>
  >
  export const BreadcrumbPage: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
  >
  export const BreadcrumbSeparator: React.FC<React.HTMLAttributes<HTMLLIElement>>
  export const BreadcrumbEllipsis: React.FC<React.HTMLAttributes<HTMLSpanElement>>
}

declare module '@/components/ui/scroll-area' {
  import * as React from 'react'
  export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'vertical' | 'horizontal'
  }
  export const ScrollArea: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>
  export const ScrollBar: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' } & React.RefAttributes<HTMLDivElement>
  >
}

declare module '@/components/ui/avatar' {
  import * as React from 'react'
  type DivRef = React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const Avatar: DivRef
  export const AvatarImage: React.ForwardRefExoticComponent<
    React.ImgHTMLAttributes<HTMLImageElement> & React.RefAttributes<HTMLImageElement>
  >
  export const AvatarFallback: DivRef
}

declare module '@/components/ui/sheet' {
  import * as React from 'react'
  export interface SheetProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }
  export const Sheet: React.FC<SheetProps>
  export const SheetTrigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const SheetClose: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >
  export const SheetContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'right' | 'bottom' | 'left' } & React.RefAttributes<HTMLDivElement>
  >
  export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const SheetTitle: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >
  export const SheetDescription: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >
}

declare module '@/components/ui/sonner' {
  import * as React from 'react'
  export const Toaster: React.FC<Record<string, unknown>>
}
