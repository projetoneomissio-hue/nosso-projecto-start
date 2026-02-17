import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Register fonts if needed (using standard fonts for now to avoid loading issues)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 40,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    logoSection: {
        width: 200,
    },
    headerRight: {
        textAlign: "right",
    },
    schoolName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1E293B",
    },
    schoolAddress: {
        fontSize: 10,
        color: "#64748B",
        marginTop: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "heavy", // Bold not always available in standard fonts
        textAlign: "center",
        marginBottom: 10,
        color: "#0F172A",
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    reciboNumber: {
        fontSize: 10,
        textAlign: "center",
        color: "#94A3B8",
        marginBottom: 30,
    },
    content: {
        marginVertical: 10,
        padding: 20,
        backgroundColor: "#F8FAFC",
        borderRadius: 4,
    },
    row: {
        flexDirection: "row",
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 4,
    },
    label: {
        width: "30%",
        fontSize: 12,
        color: "#64748B",
        fontWeight: "bold",
    },
    value: {
        width: "70%",
        fontSize: 12,
        color: "#1E293B",
    },
    totalSection: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "bold",
        marginRight: 10,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 10,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 10,
    },
    signature: {
        marginTop: 50,
        borderTopWidth: 1,
        borderTopColor: "#000",
        width: 200,
        alignSelf: "center",
        textAlign: "center",
        paddingTop: 5,
        fontSize: 10
    }
});

interface ReciboPagamentoProps {
    pagamento: {
        id: string;
        valor: number;
        data_pagamento: string;
        forma_pagamento?: string;
        matricula: {
            aluno: {
                nome_completo: string;
                cpf?: string;
            };
            turma: {
                nome: string;
                atividade: {
                    nome: string;
                };
            };
        };
    };
}

export const ReciboPagamento = ({ pagamento }: ReciboPagamentoProps) => {
    const dataFormatada = pagamento.data_pagamento
        ? format(new Date(pagamento.data_pagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.schoolName}>NEOMISSIO</Text>
                        <Text style={styles.schoolAddress}>Rua Exemplo, 123 - Centro</Text>
                        <Text style={styles.schoolAddress}>CNPJ: 00.000.000/0001-00</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 10, color: "#64748B" }}>Recibo gerado em</Text>
                        <Text style={{ fontSize: 10 }}>{format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>RECIBO DE PAGAMENTO</Text>
                <Text style={styles.reciboNumber}>#{pagamento.id.slice(0, 8).toUpperCase()}</Text>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Pagador/Responsável:</Text>
                        <Text style={styles.value}>[Responsável do Aluno]</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Aluno:</Text>
                        <Text style={styles.value}>{pagamento.matricula.aluno.nome_completo}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Referente a:</Text>
                        <Text style={styles.value}>
                            Mensalidade - {pagamento.matricula.turma.atividade.nome} ({pagamento.matricula.turma.nome})
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Data do Pagamento:</Text>
                        <Text style={styles.value}>{dataFormatada}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Forma de Pagamento:</Text>
                        <Text style={styles.value}>{pagamento.forma_pagamento || "Online/Outros"}</Text>
                    </View>
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>VALOR TOTAL:</Text>
                    <Text style={styles.totalValue}>
                        R$ {Number(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                {/* Signature */}
                <View style={styles.signature}>
                    <Text>Assinatura Autorizada</Text>
                    <Text>Neomissio Escola</Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Este documento é um comprovante digital de pagamento e tem validade fiscal.
                    {"\n"}Obrigado por confiar em nosso trabalho!
                </Text>
            </Page>
        </Document>
    );
};
