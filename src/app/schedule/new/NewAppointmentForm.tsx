"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/actions/appointment";
import styles from "./NewAppointmentForm.module.css";

interface ClientOption {
  id: string;
  name: string;
}

export default function NewAppointmentForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "biweekly">("none");
  const [occurrences, setOccurrences] = useState("3");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const result = await createAppointment(formData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
    } else {
      setStatus("error");
      setMessage(result.message || "Something went wrong.");
    }
  };

  const handleCloseModal = () => {
    if (status === "success") {
      router.push("/schedule");
    } else {
      setStatus("idle");
    }
  };

  return (
    <>
      <div className={styles.formContainer}>
        <button
          type='button'
          onClick={() => router.push("/schedule")}
          aria-label='Cancel'
          className={styles.closeButton}>
          ✕
        </button>

        {/* Ticket card */}
        <div className={styles.card}>
          {/* Perforated edge */}

          <div className={styles.cardContent}>
            <span className={styles.badge}>New Booking · Cleaning Service</span>

            <h2 className={styles.title}>Schedule a cleaning</h2>
            <p className={styles.description}>Book a single visit, or set up a recurring bi-weekly schedule.</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Client */}
              <div>
                <label htmlFor='clientId' className={styles.fieldLabel}>
                  Client
                </label>
                <div className={styles.selectContainer}>
                  <select id='clientId' name='clientId' required defaultValue='' className={styles.select}>
                    <option value='' disabled>
                      Select a client
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className={styles.selectArrow}>▾</span>
                </div>
              </div>

              {/* Date & Price */}
              <div className={styles.fieldGrid}>
                <div>
                  <label htmlFor='date' className={styles.fieldLabel}>
                    Date & time
                  </label>
                  <input id='date' type='datetime-local' name='date' required className={styles.input} />
                </div>
                <div>
                  <label htmlFor='price' className={styles.fieldLabel}>
                    Price (AUD)
                  </label>
                  <div className={styles.priceContainer}>
                    <span className={styles.pricePrefix}>$</span>
                    <input
                      id='price'
                      type='number'
                      name='price'
                      step='0.01'
                      min='0'
                      required
                      placeholder='0.00'
                      className={styles.priceInput}
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence segmented control */}
              <div>
                <span className={styles.fieldLabel}>Frequency</span>
                <div className={styles.segmentedControl}>
                  {(
                    [
                      { value: "none", label: "One-time" },
                      { value: "biweekly", label: "Bi-weekly" },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className={styles.segmentedLabel}>
                      <input
                        type='radio'
                        name='recurrence'
                        value={opt.value}
                        checked={recurrence === opt.value}
                        onChange={() => setRecurrence(opt.value)}
                        className={styles.radioHidden}
                      />
                      <span
                        className={`${styles.segmentButton} ${
                          recurrence === opt.value ? styles.segmentButtonActive : styles.segmentButtonInactive
                        }`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Occurrences */}
              {recurrence === "biweekly" && (
                <div className={styles.occurrencesContainer}>
                  <span className={styles.fieldLabel}>How many upcoming cleanings?</span>
                  <div className={styles.occurrencesGrid}>
                    {[
                      { value: "3", label: "3", sub: "~1.5 mo" },
                      { value: "6", label: "6", sub: "~3 mo" },
                      { value: "12", label: "12", sub: "~6 mo" },
                    ].map((opt) => (
                      <label key={opt.value} className={styles.segmentedLabel}>
                        <input
                          type='radio'
                          name='occurrences'
                          value={opt.value}
                          checked={occurrences === opt.value}
                          onChange={() => setOccurrences(opt.value)}
                          className={styles.radioHidden}
                        />
                        <span
                          className={`${styles.occurrenceButton} ${
                            occurrences === opt.value ? styles.occurrenceButtonActive : styles.occurrenceButtonInactive
                          }`}>
                          {opt.label}
                          <span className={styles.occurrenceSubtext}>{opt.sub}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className={styles.occurrencesNote}>You can manage or cancel individual appointments later.</p>
                </div>
              )}

              {/* Ticket stub / submit */}
              <div className={styles.formFooter}>
                <button type='submit' disabled={status === "loading"} className={styles.submitButton}>
                  {status === "loading" ? (
                    <>
                      <span className={styles.spinner} />
                      Scheduling…
                    </>
                  ) : (
                    "Confirm schedule"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      {(status === "success" || status === "error") && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div onClick={(e) => e.stopPropagation()} className={styles.modalContent}>
            <div
              className={`${styles.modalIcon} ${
                status === "success" ? styles.modalIconSuccess : styles.modalIconError
              }`}>
              {status === "success" ? "✓" : "✕"}
            </div>
            <h3 className={styles.modalTitle}>{status === "success" ? "Booking confirmed" : "Couldn't schedule"}</h3>
            <p className={styles.modalMessage}>{message}</p>
            <button
              onClick={handleCloseModal}
              className={`${styles.modalButton} ${
                status === "success" ? styles.modalButtonSuccess : styles.modalButtonError
              }`}>
              {status === "success" ? "Go to schedule" : "Try again"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
