import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar fontes (opcional, usando padrão por enquanto)
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 40,
        position: 'relative',
    },
    border: {
        border: '4px solid #1a365d',
        height: '100%',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1a365d',
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
        lineHeight: 1.5,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#d97706', // Amber-600
        textDecoration: 'underline',
    },
    course: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#1a365d',
    },
    footer: {
        marginTop: 40,
        fontSize: 10,
        textAlign: 'center',
        color: '#666',
    },
    signatureSection: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    signature: {
        borderTop: '1px solid #000',
        width: 200,
        textAlign: 'center',
        paddingTop: 5,
    },
    validation: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 8,
        color: '#999',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 10,
        backgroundColor: '#eee', // Placeholder
    }
});

interface CertificateData {
    alunoNome: string;
    cursoNome: string;
    cargaHoraria: number;
    dataEmissao: Date;
    codigoValidacao: string;
    nomeUnidade: string;
}

interface CertificateTemplateProps {
    certificados: CertificateData[];
}

const CertificateTemplate = ({ certificados }: CertificateTemplateProps) => (
    <Document>
        {certificados.map((cert, index) => (
            <Page key={index} size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.border}>
                    <View style={styles.logo} />

                    <Text style={styles.header}>Certificado de Conclusão</Text>

                    <Text style={styles.text}>Certificamos que</Text>

                    <Text style={styles.name}>{cert.alunoNome}</Text>

                    <Text style={styles.text}>concluiu com êxito o curso livre de</Text>

                    <Text style={styles.course}>{cert.cursoNome}</Text>

                    <Text style={styles.text}>
                        oferecido pela unidade {cert.nomeUnidade}, com carga horária total de {cert.cargaHoraria} horas.
                    </Text>

                    <View style={styles.signatureSection}>
                        <View style={styles.signature}>
                            <Text style={{ fontSize: 12 }}>Coordenação Pedagógica</Text>
                        </View>
                        <View style={styles.signature}>
                            <Text style={{ fontSize: 12 }}>Diretoria</Text>
                        </View>
                    </View>

                    <Text style={styles.footer}>
                        {cert.nomeUnidade} • {format(new Date(cert.dataEmissao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Text>

                    <Text style={styles.validation}>
                        Código de Validação: {cert.codigoValidacao}
                    </Text>
                </View>
            </Page>
        ))}
    </Document>
);

export default CertificateTemplate;
