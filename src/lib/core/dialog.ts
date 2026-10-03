import { Alert, AlertButton, Platform } from 'react-native';

export interface DialogRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (request: DialogRequest) => void;

let listener: Listener | null = null;

export function subscribeToDialogs(next: Listener) {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

// Mesma assinatura de Alert.alert. No nativo usa o alerta do sistema; na web,
// o alert() do navegador (sem estilo e bloqueante) é trocado pelo DialogHost do app.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web' || !listener) {
    Alert.alert(title, message, buttons);
    return;
  }
  listener({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
}
