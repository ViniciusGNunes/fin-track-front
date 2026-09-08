"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ConfigProvider,
  Layout,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tooltip,
  Popconfirm,
  Tag,
  message,
} from "antd";

import {
  CreditCardOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import { LogExpenseButton, LogExpenseModal } from "../../components/LogExpense";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import ICategory from "../../interfaces/ICategory";
import { getCategories } from "@/app/services/Backend/CategoriesService";
import { ITransactionRead } from "../../interfaces/Transaction/ITransaction";
import {
  getTransactions,
  updateTransaction,
  cancelTransaction,
  deleteTransaction,
  payExpense,
} from "@/app/services/Backend/TransactionService";
import {
  ExpenseStatus,
  PaymentMethod,
  TransactionStatus,
  TransactionType,
  TimeCategory,
  TimePeriod,
} from "@/app/Enums/FinTrackEnums";
import { camelToNormalCase, EnumToList, IEnumOptions, getTimeCategoryLabel, getTimePeriodLabel } from "@/app/utils/utils";

const { Content } = Layout;
const { Option } = Select;

/* ─── Constants ─────────────────────────────────────────────────── */
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MAX_CHIPS_PER_CELL = 3;

/* ─── Types ─────────────────────────────────────────────────────── */
interface CalendarExpenseItem {
  key: string;
  expenseId: number;
  transactionId: number;
  transactionName: string;
  category: string;
  categoryId: number;
  paymentMethod: PaymentMethod;
  rawAmount: number;
  dueDate: string; // "YYYY-MM-DD"
  status: ExpenseStatus;
  isRecurrent: boolean;
  transactionStatus: TransactionStatus;
  description?: string | null;
}

interface DayCell {
  date: Date;
  dateStr: string;
  isFiller: boolean;
  isToday?: boolean;
}

/* ─── Date helpers ───────────────────────────────────────────────── */
function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return result;
}

function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/**
 * Returns the exact [start, end] date window for the given
 * TimeCategory × TimePeriod combination using true calendar semantics:
 *
 *  Day        → the exact calendar day (today / yesterday / tomorrow)
 *  Week       → the full Sun→Sat week containing that reference day
 *  TwoWeeks   → "Half Month": first half (1–15) or second half (16–end)
 *                of the relevant month
 *  Month      → the complete calendar month
 *  Year       → the complete calendar year (Jan 1 – Dec 31)
 */
function getPeriodWindow(
  timeCat: TimeCategory,
  timePer: TimePeriod
): { start: Date; end: Date } {
  const t = today();
  const y = t.getFullYear();
  const mo = t.getMonth();
  const d = t.getDate();

  /* ── Day ──────────────────────────────────────────────────────── */
  if (timePer === TimePeriod.Day) {
    const offset = timeCat === TimeCategory.Last ? -1 : timeCat === TimeCategory.Next ? 1 : 0;
    const day = addDays(t, offset);
    return { start: day, end: day };
  }

  /* ── Week (Sun → Sat) ─────────────────────────────────────────── */
  if (timePer === TimePeriod.Week) {
    // Sunday of the current week
    const thisSunday = addDays(t, -t.getDay());
    const offset = timeCat === TimeCategory.Last ? -7 : timeCat === TimeCategory.Next ? 7 : 0;
    const start = addDays(thisSunday, offset);
    return { start, end: addDays(start, 6) };
  }

  /* ── Half Month ───────────────────────────────────────────────── */
  if (timePer === TimePeriod.TwoWeeks) {
    const inFirstHalf = d <= 15;
    const lastDayOfMonth = new Date(y, mo + 1, 0).getDate();

    if (timeCat === TimeCategory.Current) {
      return inFirstHalf
        ? { start: new Date(y, mo, 1), end: new Date(y, mo, 15) }
        : { start: new Date(y, mo, 16), end: new Date(y, mo, lastDayOfMonth) };
    }
    if (timeCat === TimeCategory.Last) {
      if (inFirstHalf) {
        // previous half = second half of previous month
        const prevMo = mo === 0 ? 11 : mo - 1;
        const prevY = mo === 0 ? y - 1 : y;
        const lastDayPrev = new Date(prevY, prevMo + 1, 0).getDate();
        return { start: new Date(prevY, prevMo, 16), end: new Date(prevY, prevMo, lastDayPrev) };
      }
      // previous half = first half of current month
      return { start: new Date(y, mo, 1), end: new Date(y, mo, 15) };
    }
    // Next
    if (inFirstHalf) {
      // next half = second half of current month
      return { start: new Date(y, mo, 16), end: new Date(y, mo, lastDayOfMonth) };
    }
    // next half = first half of next month
    const nextMo = mo === 11 ? 0 : mo + 1;
    const nextY = mo === 11 ? y + 1 : y;
    return { start: new Date(nextY, nextMo, 1), end: new Date(nextY, nextMo, 15) };
  }

  /* ── Month ────────────────────────────────────────────────────── */
  if (timePer === TimePeriod.Month) {
    let ry = y, rmo = mo;
    if (timeCat === TimeCategory.Last) { rmo -= 1; if (rmo < 0) { rmo = 11; ry -= 1; } }
    if (timeCat === TimeCategory.Next) { rmo += 1; if (rmo > 11) { rmo = 0; ry += 1; } }
    const lastDay = new Date(ry, rmo + 1, 0).getDate();
    return { start: new Date(ry, rmo, 1), end: new Date(ry, rmo, lastDay) };
  }

  /* ── Year ─────────────────────────────────────────────────────── */
  {
    let ry = y;
    if (timeCat === TimeCategory.Last) ry -= 1;
    if (timeCat === TimeCategory.Next) ry += 1;
    return { start: new Date(ry, 0, 1), end: new Date(ry, 11, 31) };
  }
}

/**
 * Builds an ordered array of DayCell objects for the calendar grid.
 * Month-like views (HalfMonth, Month, Year) are Sunday-aligned with
 * filler cells so every row is a complete week.
 */
function buildDayCells(timeCat: TimeCategory, timePer: TimePeriod): DayCell[] {
  const { start, end } = getPeriodWindow(timeCat, timePer);
  const t = today();
  const todayStr = toDateStr(t);
  const cells: DayCell[] = [];

  const needsAlignment =
    timePer === TimePeriod.TwoWeeks ||
    timePer === TimePeriod.Month ||
    timePer === TimePeriod.Year;

  // Leading fillers to align first real day to Sunday column
  if (needsAlignment) {
    const dowOffset = start.getDay(); // 0=Sun
    for (let i = dowOffset - 1; i >= 0; i--) {
      const d = addDays(start, -i - 1);
      cells.push({ date: d, dateStr: toDateStr(d), isFiller: true });
    }
  }

  // Real days
  let cur = new Date(start);
  while (cur <= end) {
    const ds = toDateStr(cur);
    cells.push({ date: new Date(cur), dateStr: ds, isFiller: false, isToday: ds === todayStr });
    cur = addDays(cur, 1);
  }

  // Trailing fillers
  if (needsAlignment) {
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const extra = 7 - remainder;
      const last = cells[cells.length - 1].date;
      for (let i = 1; i <= extra; i++) {
        const d = addDays(last, i);
        cells.push({ date: d, dateStr: toDateStr(d), isFiller: true });
      }
    }
  }

  return cells;
}

/* ─── Map transactions → flat items ─────────────────────────────── */
function mapToCalendarItems(txs: ITransactionRead[]): CalendarExpenseItem[] {
  const items: CalendarExpenseItem[] = [];
  for (const t of txs) {
    if (t.expenses && t.expenses.length > 0) {
      for (const exp of t.expenses) {
        items.push({
          key: `${t.transactionID}-${exp.expenseID}`,
          expenseId: exp.expenseID,
          transactionId: t.transactionID,
          transactionName: t.name,
          category: t.categoryName || "Uncategorized",
          categoryId: t.categoryID,
          paymentMethod: t.paymentMethod,
          rawAmount: Number(exp.amount),
          dueDate: exp.dueDate ? exp.dueDate.split("T")[0] : "",
          status: exp.status,
          isRecurrent: t.isRecurrent,
          transactionStatus: t.status,
          description: t.description,
        });
      }
    } else {
      items.push({
        key: `t-${t.transactionID}`,
        expenseId: 0,
        transactionId: t.transactionID,
        transactionName: t.name,
        category: t.categoryName || "Uncategorized",
        categoryId: t.categoryID,
        paymentMethod: t.paymentMethod,
        rawAmount: Number(t.totalAmount),
        dueDate: t.createdAtUtc ? t.createdAtUtc.split("T")[0] : "",
        status: ExpenseStatus.Pending,
        isRecurrent: t.isRecurrent,
        transactionStatus: t.status,
        description: t.description,
      });
    }
  }
  return items;
}

/* ─── Status helpers ─────────────────────────────────────────────── */
function statusChipClass(status: ExpenseStatus): string {
  switch (status) {
    case ExpenseStatus.Paid: return styles.statusPaid;
    case ExpenseStatus.Overdue: return styles.statusOverdue;
    case ExpenseStatus.PartiallyPaid: return styles.statusPartiallyPaid;
    case ExpenseStatus.Cancelled: return styles.statusCancelled;
    case ExpenseStatus.Refunded:
    case ExpenseStatus.PartiallyRefunded: return styles.statusRefunded;
    default: return styles.statusPending;
  }
}

function statusLabel(status: ExpenseStatus): string {
  return ExpenseStatus[status] || "Pending";
}

function statusTagColor(status: ExpenseStatus): string {
  switch (status) {
    case ExpenseStatus.Paid: return "success";
    case ExpenseStatus.Overdue: return "error";
    case ExpenseStatus.PartiallyPaid: return "processing";
    case ExpenseStatus.Cancelled: return "default";
    case ExpenseStatus.Refunded:
    case ExpenseStatus.PartiallyRefunded: return "purple";
    default: return "warning";
  }
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function CalendarPage() {
  const [collapsed, setCollapsed] = useState(false);

  const [transactions, setTransactions] = useState<ITransactionRead[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Create Expense modal */
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  /* Edit modal */
  const [editingItem, setEditingItem] = useState<CalendarExpenseItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  /* Time filter options */
  const paymentOptions = useMemo(() => EnumToList(PaymentMethod), []);
  const timeCategoryOptions = useMemo(() => EnumToList(TimeCategory), []);
  const timePeriodOptions = useMemo(() => EnumToList(TimePeriod), []);

  const initialCategory: IEnumOptions = useMemo(
    () => timeCategoryOptions.find((c) => c.value === TimeCategory.Current) || { label: "Current", value: TimeCategory.Current },
    [timeCategoryOptions]
  );
  const initialPeriod: IEnumOptions = useMemo(
    () => timePeriodOptions.find((p) => p.value === TimePeriod.Month) || { label: "Month", value: TimePeriod.Month },
    [timePeriodOptions]
  );

  const [selectedCategory, setSelectedCategory] = useState<IEnumOptions>(initialCategory);
  const [selectedPeriod, setSelectedPeriod] = useState<IEnumOptions>(initialPeriod);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchData = useCallback(async (catVal: number, perVal: number) => {
    try {
      setLoadingTable(true);
      const data = await getTransactions({ timeCategory: catVal, timePeriod: perVal });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to get transactions:", err);
      setTransactions([]);
    } finally {
      setLoadingTable(false);
    }
  }, []); // no state deps — callers always pass values explicitly

  useEffect(() => {
    getCategories().then(setCategories).catch(() => { });
    fetchData(TimeCategory.Current, TimePeriod.Month);
  }, [fetchData]); // run only once on mount — fetchData is stable

  /* ── Derived data ──────────────────────────────────────────────── */
  const calendarItems = useMemo(() => mapToCalendarItems(transactions), [transactions]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarExpenseItem[]>();
    for (const item of calendarItems) {
      if (!item.dueDate) continue;
      if (!map.has(item.dueDate)) map.set(item.dueDate, []);
      map.get(item.dueDate)!.push(item);
    }
    return map;
  }, [calendarItems]);

  const dayCells = useMemo(
    () => buildDayCells(
      Number(selectedCategory.value) as TimeCategory,
      Number(selectedPeriod.value) as TimePeriod
    ),
    [selectedCategory.value, selectedPeriod.value]
  );

  /* Stats */
  const totalPeriodExpenses = useMemo(() =>
    transactions.reduce((acc, t) => {
      if (t.expenses?.length > 0) return acc + t.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      return acc + Number(t.totalAmount || 0);
    }, 0), [transactions]);

  const activeInstallmentsCount = useMemo(() =>
    transactions.filter(t => t.isInstallment && t.status === TransactionStatus.Active).length,
    [transactions]);

  const pendingBillsAmount = useMemo(() =>
    transactions.reduce((acc, t) => {
      if (t.expenses?.length > 0) {
        return acc + t.expenses
          .filter(e => e.status === ExpenseStatus.Pending || e.status === ExpenseStatus.Overdue || e.status === ExpenseStatus.PartiallyPaid)
          .reduce((s, e) => s + Number(e.remainingAmount ?? (Number(e.amount || 0) - Number(e.paidAmount || 0))), 0);
      }
      return acc;
    }, 0), [transactions]);

  /* ── Actions ───────────────────────────────────────────────────── */
  const openEditModal = (item: CalendarExpenseItem) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      name: item.transactionName,
      amount: item.rawAmount,
      categoryId: item.categoryId,
      paymentMethod: item.paymentMethod,
      description: item.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (values: Record<string, unknown>) => {
    if (!editingItem) return;
    try {
      setLoading(true);
      await updateTransaction(editingItem.transactionId, {
        name: values.name as string,
        description: (values.description as string) || null,
        totalAmount: Number(values.amount),
        categoryID: Number(values.categoryId),
        paymentMethod: Number(values.paymentMethod),
        type: TransactionType.Expense,
        status: editingItem.transactionStatus,
      });
      message.success("Expense updated successfully");
      setIsEditModalOpen(false);
      await fetchData(Number(selectedCategory.value), Number(selectedPeriod.value));
    } catch {
      message.error("Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (expenseId: number) => {
    if (expenseId <= 0) { message.warning("No linked expense to mark as paid."); return; }
    try {
      setLoading(true);
      await payExpense(expenseId);
      message.success("Marked as paid");
      setIsEditModalOpen(false);
      await fetchData(Number(selectedCategory.value), Number(selectedPeriod.value));
    } catch {
      message.error("Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (transactionId: number) => {
    try {
      setLoading(true);
      await cancelTransaction(transactionId);
      message.success("Subscription cancelled");
      setIsEditModalOpen(false);
      await fetchData(Number(selectedCategory.value), Number(selectedPeriod.value));
    } catch {
      message.error("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId: number) => {
    try {
      setLoading(true);
      await deleteTransaction(transactionId);
      message.success("Transaction deleted");
      setIsEditModalOpen(false);
      await fetchData(Number(selectedCategory.value), Number(selectedPeriod.value));
    } catch {
      message.error("Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  };

  /* ── Period label ─────────────────────────────────────────────── */
  const periodRangeLabel = useMemo(() => {
    const real = dayCells.filter((c) => !c.isFiller);
    if (!real.length) return "";
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
    const fmtFull = (d: Date) =>
      d.toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
    return real.length === 1 ? fmtFull(real[0].date) : `${fmt(real[0].date)} – ${fmtFull(real[real.length - 1].date)}`;
  }, [dayCells]);

  const realDayCount = useMemo(() => dayCells.filter((c) => !c.isFiller).length, [dayCells]);

  /* ── Year view: group by month ───────────────────────────────── */
  const yearMonthGroups = useMemo(() => {
    if (Number(selectedPeriod.value) !== TimePeriod.Year) return null;
    type Group = { label: string; cells: DayCell[] };
    const groups: Group[] = [];
    for (const cell of dayCells) {
      const label = `${MONTH_NAMES[cell.date.getMonth()]} ${cell.date.getFullYear()}`;
      let g = groups.find((x) => x.label === label);
      if (!g) { g = { label, cells: [] }; groups.push(g); }
      g.cells.push(cell);
    }
    return groups;
  }, [dayCells, selectedPeriod.value]);

  /* ── Render chip ─────────────────────────────────────────────── */
  const renderChip = (item: CalendarExpenseItem) => (
    <div
      key={item.key}
      className={`${styles.expenseChip} ${statusChipClass(item.status)}`}
      onClick={() => openEditModal(item)}
      title={`${item.transactionName} — $${item.rawAmount.toFixed(2)}`}
    >
      <span className={styles.chipName}>{item.transactionName}</span>
      <span className={styles.chipAmount}>${item.rawAmount.toFixed(2)}</span>
    </div>
  );

  /* ── Render day cell ─────────────────────────────────────────── */
  const renderDayCell = (cell: DayCell) => {
    if (cell.isFiller) {
      return <div key={cell.dateStr + "-filler"} className={`${styles.dayCell} ${styles.empty}`} />;
    }

    const items = itemsByDate.get(cell.dateStr) || [];
    const dayTotal = items.reduce((s, i) => s + i.rawAmount, 0);
    const visible = items.slice(0, MAX_CHIPS_PER_CELL);
    const overflow = items.length - MAX_CHIPS_PER_CELL;

    return (
      <div
        key={cell.dateStr}
        className={`${styles.dayCell} ${cell.isToday ? styles.today : ""}`}
      >
        <div className={styles.dayCellHeader}>
          <span className={styles.dayCellNumber}>{cell.date.getDate()}</span>
          <span className={styles.dayCellWeekday}>{WEEKDAYS[cell.date.getDay()]}</span>
          {items.length > 0 && (
            <span className={styles.dayCellTotal}>-${dayTotal.toFixed(2)}</span>
          )}
        </div>

        {visible.map(renderChip)}

        {overflow > 0 && (
          <div
            className={styles.moreChips}
            onClick={() => openEditModal(items[MAX_CHIPS_PER_CELL])}
          >
            +{overflow} more
          </div>
        )}

        {items.length === 0 && <div className={styles.emptyCellMsg}>—</div>}
      </div>
    );
  };

  /* ── Render grid ─────────────────────────────────────────────── */
  const renderGrid = () => {
    if (yearMonthGroups) {
      return yearMonthGroups.map((g) => (
        <div key={g.label} className={styles.yearMonthBlock}>
          <div className={styles.yearMonthTitle}>{g.label}</div>
          <div className={styles.calendarGrid} style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {g.cells.map(renderDayCell)}
          </div>
        </div>
      ));
    }

    const cols = Number(selectedPeriod.value) === TimePeriod.Day ? 1 : 7;
    return (
      <div
        className={styles.calendarGrid}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {dayCells.map(renderDayCell)}
      </div>
    );
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME} locale={FINTRACK_LOCALE}>
      <Layout className={styles.layout}>
        <Sidebar collapsed={collapsed} selectedKey="calendar" onSelectKey={() => { }} />

        <Layout className={styles.mainLayout}>
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />

          <Content className={styles.content}>
            {/* Page header */}
            <div className={styles.pageHeader}>
              <div>
                <h2>Calendário de Despesas</h2>
                <p>Visualize suas contas vencidas, atuais e futuras distribuídas pelo calendário.</p>
              </div>
              <LogExpenseButton onClick={() => setIsLogModalOpen(true)} />
            </div>

            {/* Stat cards */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total de Despesas no Período"
                    value={totalPeriodExpenses}
                    precision={2}
                    prefix="R$"
                    styles={{ value: { color: "#f43f5e", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Parcelamentos Ativos"
                    value={activeInstallmentsCount}
                    prefix={<CreditCardOutlined />}
                    styles={{ value: { color: "#38bdf8", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Contas Pendentes / Atrasadas"
                    value={pendingBillsAmount}
                    precision={2}
                    prefix="R$"
                    styles={{ value: { color: "#f59e0b", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Calendar card */}
            <Card
              className={styles.calendarCard}
              title={
                <>
                  <Select
                    className={styles.titleSelect}
                    labelInValue
                    value={{
                      value: selectedPeriod.value,
                      label: getTimePeriodLabel(selectedPeriod.value),
                    }}
                    onChange={(val: any) => {
                      const numVal = typeof val === "object" && val !== null ? Number(val.value) : Number(val);
                      const opt = timePeriodOptions.find((p) => Number(p.value) === numVal) || {
                        label: getTimePeriodLabel(numVal),
                        value: numVal,
                      };
                      setSelectedPeriod(opt);
                      fetchData(Number(selectedCategory.value), numVal);
                    }}
                  >
                    {timePeriodOptions.map((tp) => (
                      <Option key={tp.value} value={tp.value}>
                        {getTimePeriodLabel(tp.value)}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    className={styles.titleSelect}
                    labelInValue
                    value={{
                      value: selectedCategory.value,
                      label: getTimeCategoryLabel(selectedCategory.value, selectedPeriod.value),
                    }}
                    onChange={(val: any) => {
                      const numVal = typeof val === "object" && val !== null ? Number(val.value) : Number(val);
                      const opt = timeCategoryOptions.find((c) => Number(c.value) === numVal) || {
                        label: getTimeCategoryLabel(numVal, selectedPeriod.value),
                        value: numVal,
                      };
                      setSelectedCategory(opt);
                      fetchData(numVal, Number(selectedPeriod.value));
                    }}
                  >
                    {timeCategoryOptions.map((tc) => (
                      <Option key={tc.value} value={tc.value}>
                        {getTimeCategoryLabel(tc.value, selectedPeriod.value)}
                      </Option>
                    ))}
                  </Select>

                  <Button
                    type="primary"
                    className={styles.titleButton}
                    onClick={() => fetchData(Number(selectedCategory.value), Number(selectedPeriod.value))}
                    loading={loadingTable}
                  >
                    Filtrar
                  </Button>
                </>
              }
              variant="borderless"
            >
              {/* Period range label */}
              <div className={styles.periodLabel}>
                <CalendarOutlined />
                {periodRangeLabel}
                <span>({realDayCount} {realDayCount === 1 ? "dia" : "dias"})</span>
              </div>

              {renderGrid()}
            </Card>
          </Content>
        </Layout>
      </Layout>

      {/* ── Edit / Action Modal ─────────────────────────────────── */}
      <Modal
        title={`Editar: ${editingItem?.transactionName || ""}`}
        open={isEditModalOpen}
        onCancel={() => { setIsEditModalOpen(false); setEditingItem(null); editForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnHidden
        style={{ top: 40 }}
      >
        {/* Info banner */}
        {editingItem && (
          <div className={styles.modalChipPreview}>
            <div className={styles.chipPreviewDetails}>
              <div className={styles.chipPreviewName}>{editingItem.transactionName}</div>
              <div className={styles.chipPreviewMeta}>
                Vencimento: {editingItem.dueDate ? dayjs(editingItem.dueDate).format("DD/MM/YYYY") : "—"} &nbsp;·&nbsp; {editingItem.category} &nbsp;·&nbsp;
                <Tag color={statusTagColor(editingItem.status)} style={{ marginLeft: 4 }}>
                  {statusLabel(editingItem.status)}
                </Tag>
              </div>
            </div>
          </div>
        )}

        <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Título / Nome da Despesa"
                rules={[{ required: true, message: "Insira o nome da despesa" }, { max: 150 }]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="amount"
                label="Valor (R$)"
                rules={[{ required: true, message: "Insira o valor" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0.01} max={999999999.99} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Categoria"
                rules={[{ required: true, message: "Selecione uma categoria" }]}
              >
                <Select placeholder="Selecione a categoria">
                  {categories.map((cat) => (
                    <Option key={cat.categoryID} value={cat.categoryID}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Forma de Pagamento"
                rules={[{ required: true, message: "Selecione a forma de pagamento" }]}
              >
                <Select placeholder="Selecione a forma de pagamento">
                  {paymentOptions.map((pay) => (
                    <Option key={pay.value} value={pay.value}>{camelToNormalCase(pay.label)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="description" label="Descrição (Opcional)" rules={[{ max: 500 }]}>
                <Input.TextArea rows={2} placeholder="Observações adicionais" maxLength={500} />
              </Form.Item>
            </Col>
          </Row>

          {/* Footer action buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <Space>
              {editingItem && editingItem.expenseId > 0 &&
                (editingItem.status === ExpenseStatus.Pending ||
                  editingItem.status === ExpenseStatus.Overdue ||
                  editingItem.status === ExpenseStatus.PartiallyPaid) && (
                  <Tooltip title="Marcar como Pago">
                    <Button
                      icon={<CheckCircleOutlined />}
                      style={{ borderColor: "#10b981", color: "#10b981" }}
                      loading={loading}
                      onClick={() => handleMarkAsPaid(editingItem.expenseId)}
                    >
                      Pagar
                    </Button>
                  </Tooltip>
                )}

              {editingItem?.isRecurrent && editingItem.transactionStatus === TransactionStatus.Active && (
                <Popconfirm
                  title="Cancel Subscription?"
                  description="Past paid history remains. Future bills will be stopped."
                  onConfirm={() => editingItem && handleCancelSubscription(editingItem.transactionId)}
                  okText="Yes, Cancel"
                  cancelText="No"
                >
                  <Tooltip title="Cancel Subscription">
                    <Button icon={<StopOutlined />} style={{ borderColor: "#fa8c16", color: "#fa8c16" }} loading={loading}>
                      Cancel Sub
                    </Button>
                  </Tooltip>
                </Popconfirm>
              )}

              {editingItem && (
                <Popconfirm
                  title="Delete Expense?"
                  description="Permanently delete this transaction and all associated records?"
                  onConfirm={() => editingItem && handleDelete(editingItem.transactionId)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Tooltip title="Delete Permanently">
                    <Button danger icon={<DeleteOutlined />} loading={loading}>Delete</Button>
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>

            <Space>
              <Button onClick={() => { setIsEditModalOpen(false); editForm.resetFields(); }}>
                Cancel
              </Button>
              <Button type="primary" icon={<EditOutlined />} loading={loading} onClick={() => editForm.submit()}>
                Save Changes
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* ── Log New Expense Modal ─────────────────────────────── */}
      <LogExpenseModal
        open={isLogModalOpen}
        onCancel={() => setIsLogModalOpen(false)}
        onSuccess={() =>
          fetchData(
            Number(selectedCategory.value),
            Number(selectedPeriod.value)
          )
        }
        categories={categories}
      />
    </ConfigProvider>
  );
}
