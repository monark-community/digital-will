"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactService } from "@/lib/services";
import { AxiosError } from "axios";

/**
 * Hook to get all contacts
 */
export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactService.getContacts(),
  });
}

/**
 * Hook to add a new contact
 */
export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      walletAddress: string;
    }) => contactService.addContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Add contact error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook to remove a contact
 */
export function useRemoveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => contactService.removeContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Remove contact error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook to update a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
        walletAddress?: string;
      };
    }) => contactService.updateContact(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Update contact error:", error.response?.data?.message);
    },
  });
}
