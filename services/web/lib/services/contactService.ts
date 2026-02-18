import { apiClient } from "../api-client";
import { API_ROUTES } from "../config";
import type { Contact } from "../types";

/**
 * Get all contacts for the current user
 */
export async function getContacts(): Promise<Contact[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: { contacts: Contact[] };
  }>(API_ROUTES.CONTACTS.BASE);
  return response.data.data.contacts;
}

/**
 * Add a new contact
 */
export async function addContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  walletAddress: string;
}): Promise<Contact> {
  const response = await apiClient.post<{
    success: boolean;
    data: { contact: Contact };
  }>(API_ROUTES.CONTACTS.BASE, data);
  return response.data.data.contact;
}

/**
 * Remove a contact
 */
export async function removeContact(contactId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.CONTACTS.BY_ID(contactId));
}

/**
 * Update a contact
 */
export async function updateContact(
  contactId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    walletAddress?: string;
  }
): Promise<Contact> {
  const response = await apiClient.patch<{
    success: boolean;
    data: { contact: Contact };
  }>(API_ROUTES.CONTACTS.BY_ID(contactId), data);
  return response.data.data.contact;
}
