"use client";

import { useState, useEffect } from "react";
import { useContacts, useAddContact, useRemoveContact, useUpdateContact, useCurrentUser } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const { data: contacts, isLoading, error } = useContacts();
  const { mutate: addContact, isPending: isAdding } = useAddContact();
  const { mutate: removeContact } = useRemoveContact();
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();
  const { data: user } = useCurrentUser();

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    walletAddress: "",
    relationship: "",
  });

  const [initialFormData, setInitialFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    walletAddress: "",
    relationship: "",
  });

  useEffect(() => {
    const { errors } = validateContactForm();
    setFormErrors(errors);
  }, [formData]);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateContactForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Prénom
    if (!formData.firstName.trim()) {
      errors.push("First name is required");
    } else if (formData.firstName.length > 50) {
      errors.push("First name must be less than 50 characters");
    }

    // Nom
    if (!formData.lastName.trim()) {
      errors.push("Last name is required");
    } else if (formData.lastName.length > 50) {
      errors.push("Last name must be less than 50 characters");
    }

    // Email
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push("Please enter a valid email address");
      }
    }

    // Wallet Address
    if (!formData.walletAddress.trim()) {
      errors.push("Wallet address is required");
    } else {
      // Validation plus robuste avec ethers (si disponible)
      try {
        // Option 1: Validation simple
        if (!formData.walletAddress.startsWith("0x") || formData.walletAddress.length !== 42) {
          errors.push("Wallet address must start with 0x and be 42 characters long");
        }
        
        // Option 2: Si ethers est disponible (recommandé)
        // ethers.getAddress(formData.walletAddress);
      } catch (error) {
        errors.push("Invalid wallet address format");
      }
    }

    // Phone (optionnel mais valide si présent)
    if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
      const phoneRegex = /^\d{10}$/; // 10 chiffres
      const onlyNumbers = formData.phoneNumber.replace(/\D/g, '');
      if (!phoneRegex.test(onlyNumbers)) {
        errors.push("Phone number must be 10 digits");
      }
    }

    // Relationship (optionnel mais limite)
    if (formData.relationship && formData.relationship.length > 30) {
      errors.push("Relationship must be less than 30 characters");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };
  const hasChanges = 
    formData.firstName !== initialFormData.firstName ||
    formData.lastName !== initialFormData.lastName ||
    formData.email !== initialFormData.email ||
    formData.phoneNumber !== initialFormData.phoneNumber ||
    formData.walletAddress !== initialFormData.walletAddress;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.walletAddress) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!formData.walletAddress.startsWith("0x") || formData.walletAddress.length !== 42) {
      setErrorMessage("Please enter a valid wallet address (must start with 0x and be 42 characters)");
      return;
    }

    const contactData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      walletAddress: formData.walletAddress,
      phoneNumber: formData.phoneNumber || undefined,
      relationship: formData.relationship || undefined,
    };

    if (editingContact) {
      updateContact(
        { contactId: editingContact.contactId, data: contactData },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditingContact(null);
            setSuccessMessage("Contact updated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
          },
          onError: (error: any) => {
            const msg = error?.response?.data?.message || "Failed to update contact";
            setErrorMessage(msg);
          },
        }
      );
    } else {
      addContact(contactData, {
        onSuccess: () => {
          setShowForm(false);
          setSuccessMessage("Contact added successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || "Failed to add contact";
          setErrorMessage(msg);
        },
      });
    }
  };

  const handleRemoveContact = (contact: Contact) => {
    setContactToDelete(contact);
  };

  const confirmDeleteContact = () => {
    if (!contactToDelete) return;
    
    setErrorMessage(null);
    removeContact(contactToDelete.contactId, {
      onSuccess: () => {
        setSuccessMessage("Contact removed successfully!");
        setContactToDelete(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Failed to remove contact";
        setErrorMessage(msg);
      },
    });
  };

  const cancelDeleteContact = () => {
    setContactToDelete(null);
  };

  const copyToClipboard = async (address: string, contactId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(contactId);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleEditContact = (contact: Contact) => {
    const formValues = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phoneNumber: contact.phoneNumber || "",
      walletAddress: contact.walletAddress,
      relationship: contact.relationship || "",
    };
    setFormData(formValues);
    setInitialFormData(formValues);
    setEditingContact(contact);
    setShowForm(true);
    setErrorMessage(null);
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      walletAddress: "",
      relationship: "",
    });
    setInitialFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      walletAddress: "",
      relationship: "",
    });
    setErrorMessage(null);
  };

  return (
    <>
      <Header isAuthenticated={true} user={user || undefined} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            My Contacts
          </h1>
          <p className="text-[var(--text-muted)]">
            Manage your trusted contacts who can be added as secondary members in your digital wills.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-500/10 border border-green-500/20 p-4">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

        <div className="mb-6">
        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              phoneNumber: "",
              walletAddress: "",
              relationship: "",
            });
            setInitialFormData({
              firstName: "",
              lastName: "",
              email: "",
              phoneNumber: "",
              walletAddress: "",
              relationship: "",
            });
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Contact</span>
        </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <button
                  onClick={handleCancelForm}
                  className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {errorMessage && (
                  <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
                    {successMessage}
                  </div>
                )}

                {formErrors.length > 0 && (
                  <div className="mb-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-500 text-sm font-medium mb-1">Please fix the following:</p>
                    <ul className="list-disc list-inside text-yellow-500/80 text-xs space-y-1">
                      {formErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        htmlFor="firstName" 
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor="lastName" 
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="phoneNumber" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Phone Number <span className="text-[var(--text-muted-alt)] text-xs">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="walletAddress" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Wallet Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted-alt)]">
                      Ethereum wallet address (starts with 0x)
                    </p>
                  </div>
                  <div>
                    <label 
                      htmlFor="relationship" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Relationship <span className="text-[var(--text-muted-alt)] text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="relationship"
                      name="relationship"
                      value={formData.relationship || ""}
                      onChange={handleInputChange}
                      maxLength={30}  // ← Limite à 30 caractères
                      placeholder="e.g., spouse, child, friend, colleague"
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted-alt)]">
                      Optional: How is this person related to you? (max 30 characters)
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isAdding || isUpdating || (editingContact !== null && !hasChanges) || !validateContactForm().isValid}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      {isAdding || isUpdating
                        ? editingContact
                          ? "Updating..."
                          : "Adding..."
                        : editingContact
                        ? "Save Changes"
                        : "Add Contact"}
                    </button>
                    {editingContact && (
                      <button
                        type="button"
                        onClick={handleResetForm}
                        disabled={!hasChanges}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-6 py-2 bg-[var(--bg-section)] hover:bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
        }

        {contactToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  Delete Contact
                </h2>
                <p className="text-[var(--text-muted)] mb-6">
                  Are you sure you want to remove <span className="font-semibold text-[var(--text-primary)]">{contactToDelete.firstName} {contactToDelete.lastName}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={confirmDeleteContact}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={cancelDeleteContact}
                    className="flex-1 px-4 py-2 bg-[var(--bg-section)] hover:bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoading && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 text-center">
              <p className="text-[var(--text-muted)]">Loading contacts...</p>
            </div>
          )}

          {error && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 text-center">
              <p className="text-red-400">Failed to load contacts. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && contacts && contacts.length === 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 text-center">
              <p className="text-[var(--text-muted)]">
                No contacts yet. Add your first contact to get started.
              </p>
            </div>
          )}

        {!isLoading && !error && contacts && contacts.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              All Contacts ({contacts?.length || 0})
            </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[var(--border-section)]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Relationship
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Wallet Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact: Contact) => (
                      <tr
                        key={contact.contactId}
                        className="border-b border-[var(--border-section)] hover:bg-[var(--bg-section)] transition-colors"
                      >
                        <td className="py-4 px-4 text-[var(--text-primary)]">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)]">
                          {contact.email}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)]">
                          {contact.phoneNumber || "-"}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)]">
                          {contact.relationship || "-"}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)] font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>
                              {contact.walletAddress.substring(0, 6)}...{contact.walletAddress.substring(contact.walletAddress.length - 4)}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() => copyToClipboard(contact.walletAddress, contact.contactId)}
                                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                title="Copy address"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              {copiedAddress === contact.contactId && (
                                <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                  Address copied!
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                              title="Edit contact"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemoveContact(contact)}
                              className="p-2 text-red-400 hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                              title="Remove contact"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
        )}
        </div>
      </div>
      </div>
    </>
  );
}
